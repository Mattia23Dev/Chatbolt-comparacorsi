const router = require('express').Router();
const WhatsappCloudAPI = require('../utils/WhatsappCloudApi');
const OpenAI = require('openai');
const OpenAIChat = require('../utils/Openai');
const {sendTemplateMessage} = require('../utils/WhatsappCloudApi')
const { saveMessageOrChat, getChat, saveInfoLeadDb, getUser } = require('../utils/MongoDB');
const { extractJSONFromOpenAIResponse } = require('../utils/UtilsFunction');
const { format } = require('date-fns');
const { getIO } = require('../utils/WebSocket');
const Project = require('../models/project');
const Flow = require('../models/flow');
require('dotenv').config();

const getFlowByPhoneNumber = async (phoneNumber) => {
    const project = await Project.findOne({ phoneNumberId: phoneNumber });
    const flow = await Flow.findOne({projectId: project._id})
    return project ? {flow: flow, projectId: project._id, clientId: project.client, project: project} : null;
  };

  const getTokenByPhoneNumber = async (phoneNumber) => {
    const project = await Project.findOne({ phoneNumberId: phoneNumber });
    const flow = await Flow.findOne({projectId: project._id})
    return project ? {token: project.tokenMeta, flow: flow} : null;
  }

const getFormattedDate = () => {
    const now = new Date();
    return format(now, 'dd-MM-yyyy HH:mm');
  };

  const customPromptSave = (project, messagesContent) => {
    let prompt = `
      Messaggi precedenti:
      ${messagesContent}
  
      Analizza la conversazione e estrai le seguenti informazioni:
      1. Nome dell'utente
      2. Cognome dell'utente
      3. Email dell'utente
      4. Riassunto della conversazione (massimo 10 parole)
      5. Data e ora preferita per l'appuntamento (se menzionata)
  
      Per la data e l'ora dell'appuntamento, Oggi è: ${getFormattedDate()}:
          - Se viene menzionata una data specifica, convertila nel formato DD-MM-YYYY HH:mm
          - Se viene menzionato "domani", usa la data di domani nel formato DD-MM-YYYY
          - Se viene menzionato un giorno della settimana (es. "lunedì prossimo"), calcola la data del prossimo giorno corrispondente
    `;
  
    if (project.customFields && project.customFields.length > 0) {
      prompt += `
        Inoltre, estrai le seguenti informazioni personalizzate:
      `;
      project.customFields.forEach((field, index) => {
        prompt += `
        ${index + 6}. ${field.name}
        `;
      });
    }
  
    prompt += `
      Fornisci le informazioni estratte nel seguente formato JSON, senza alcun testo aggiuntivo o formattazione:
      {"first_name":"","last_name":"","email":"","conversation_summary":"","appointment_date":"", ${project.customFieldsArray.map(field => `"${field.name}":""`).join(', ')}}
  
      Assicurati di riempire i campi solo con le informazioni disponibili, lasciando vuoti quelli per cui non ci sono informazioni.
      Per il campo appointment_date, usa sempre il formato DD-MM-YYYY HH:mm.
    `;
  
    return prompt;
  };

const promptSalvaInfo = `
Analizza la conversazione contenuta nella variabile {{messagiSalvati}}. Il tuo compito è estrarre e salvare le seguenti informazioni:

1. Salva il nome dell'utente nella variabile {{Lead_First_name}}
2. Salva il cognome dell'utente nella variabile {{Lead_last_name}}
3. Salva l'email dell'utente nella variabile {{email}}

4. Crea un riassunto chiaro in una sola frase di massimo 10 parole, riepilogando il corso a cui è interessato il cliente ed eventuali particolari necessità. Non includere dati personali, date di appuntamenti o riferimenti a specifici Atenei (come Unimarconi, Unipegaso o Mercatorum). Se non ci sono abbastanza informazioni sui corsi, usa la frase "Cliente interessato ad informazioni sui Corsi di Università Telematiche". Salva questo riassunto nella variabile {{Conversation_summary}}. Se {{Conversation_summary}} è già valorizzata, aggiornala con il riassunto più recente.

5. Se l'utente ha espresso preferenze su quando effettuare la chiamata con l'orientatore, salva questa informazione nella variabile {{appointment_date}}. Se {{appointment_date}} è già valorizzata, aggiornala con il dato più recente.

Salva tutte queste informazioni in Ai trigger, associandole al numero di telefono del cliente.
`;

const Openai = new OpenAIChat(process.env.OPENAI_API_KEY, "gpt-4o")
let messageQueue = [];
let debounceTimer = null;
let isProcessing = false;
let userInfo = {};

const processQueue = async () => {
    const io = getIO();
    
    if (isProcessing || messageQueue.length === 0) return;
    isProcessing = true;
  
    const currentMessages = [...messageQueue];
    messageQueue = [];

    const messagesByPhone = {};
    currentMessages.forEach(msg => {
      if (!messagesByPhone[msg.numeroTelefono]) {
        messagesByPhone[msg.numeroTelefono] = [];
      }
      messagesByPhone[msg.numeroTelefono].push(msg);
    });
  
    for (const [numeroTelefono, messages] of Object.entries(messagesByPhone)) {
      const phoneNumberId = messages[0].phoneNumberId;
      console.log(phoneNumberId)
      const existingChat = await getChat({ numeroTelefono });
      const {flow, projectId, clientId, project} = await getFlowByPhoneNumber(phoneNumberId);

      if (existingChat && existingChat.active === false) {
        console.log('Non attivo ma salvo')
        for (const msg of messages) {
          const chat = await saveMessageOrChat({
            userId: '1',
            leadId: '10',
            flowId: flow?._id,
            projectId: projectId,
            clientId: clientId,
            numeroTelefono: numeroTelefono,
            content: msg.content,
            sender: 'user',
          });

          io.emit('updateChat', chat);
        }
        continue;
      }

      let messaggiSalvati = existingChat && existingChat.messages ? existingChat.messages : [];
  
      messages.forEach(msg => {
        messaggiSalvati.push({ sender: 'user', content: msg.content });
      });
  
      const messagesContent = messaggiSalvati.map(message =>
        `${message.sender === 'user' ? 'Utente' : 'Bot'}: ${message.content}`
      ).join('\n');

      //const existingLead = await getUser({numeroTelefono})
  
      const customPrompt = `
        Messaggi precedenti:
        ${messagesContent}
      `;
      console.log(flow?.prompt)
      const replyToUser = await Openai.getOpenAIResponse(customPrompt, flow?.prompt);
      const customPromptToSave = customPromptSave(project, messagesContent);
      const openAIResponse = await Openai.saveInfoLead(customPromptToSave, promptSalvaInfo);
      const extractedInfo = await extractJSONFromOpenAIResponse(openAIResponse);

      if (!userInfo[numeroTelefono]) {
        userInfo[numeroTelefono] = {
          numeroTelefono: numeroTelefono
        };
      }

      messaggiSalvati.push({ sender: 'bot', content: replyToUser });

      for (const msg of messages) {
        const chat = await saveMessageOrChat({
          userId: '1',
          leadId: '10',
          flowId: flow?._id,
          projectId: projectId,
          clientId: clientId,
          numeroTelefono: numeroTelefono,
          content: msg.content,
          sender: 'user'
        });

        io.emit('updateChat', chat);
      }
      const chat = await saveMessageOrChat({
        userId: '1',
        leadId: '10',
        flowId: flow?._id,
        projectId: projectId,
        clientId: clientId,
        numeroTelefono: numeroTelefono,
        content: replyToUser,
        sender: 'bot'
      });

      io.emit('updateChat', chat);
  
      Object.assign(userInfo[numeroTelefono], extractedInfo);
      try {
        const savedLead = await saveInfoLeadDb(userInfo[numeroTelefono]);
        console.log('Informazioni del lead salvate/aggiornate:');
      } catch (error) {
        console.error('Errore nel salvare le informazioni del lead:', error);
      }
      // Invia una sola risposta cumulativa
      messages[0].sendTextMessage(replyToUser);
      if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processQueue, (flow.responseTime || 20) * 1000);
    }
  
    isProcessing = false;
    if (messageQueue.length > 0) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processQueue, 20000);
    }
  };

module.exports = router.post('/', async (req, res) => {
    try {
        const data = req.body;

        if (data.object) {
            const phoneNumberId = data.entry[0].changes[0].value.metadata.phone_number_id;
            const {token, flow} = await getTokenByPhoneNumber(phoneNumberId)
            const isNewMessage = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (isNewMessage) {
                const Whatsapp = new WhatsappCloudAPI({
                  data,
                  graphApiVersion: 'v20.0',
                  token: token,
                });
                
                const numeroTelefono = Whatsapp.getRecipientPhoneNumber();
                const messageId = Whatsapp.getMessage().id;
                const name = Whatsapp.getRecipientName()
        
                if (Whatsapp.getMessage().type === 'text') {
                  const messageBody = Whatsapp.getMessage().text?.body || '';
                                    
                  messageQueue.push({
                    id: messageId,
                    name: name,
                    numeroTelefono: numeroTelefono,
                    phoneNumberId: phoneNumberId,
                    content: messageBody,
                    sendTextMessage: (reply) => Whatsapp.sendTextMessage(reply)
                  });
        
                  if (debounceTimer) {
                    clearTimeout(debounceTimer);
                  }
        
                  debounceTimer = setTimeout(processQueue, (flow.responseTime || 20) * 1000);
                }
              }

            res.status(200).send();
        }
        else {
            res.status(404).send();
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send();
    }
});
const templateName = 'test_oubound';
const languageCode = 'it';
const parameters = [
    { type: 'text', text: 'Daje' },
];

//sendTemplateMessage(templateName, languageCode, parameters)

/* MESSAGGI INTERATTIVI
                // We have received a quick reply message in response of button clicks
                else if (Whatsapp.getMessage().type === 'interactive') {
                    const replyId = Whatsapp.getInteractiveButtonReplyId();//message?.interactive?.button_reply?.id;

                    // The user has pressed on speak to a human button
                    if (replyId === 'speak_to_human') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);

                        const responseMessage = 'Certamente, ti ho appena condiviso il numero del mio amico umano'
                        //sendTextMessage(phoneNoId, from, responseMessage);
                        Whatsapp.sendTextMessage(responseMessage);

                        // This is array of objects.
                        const contactsData = [
                            {
                                addresses: [
                                    {
                                        street: "Largo Giuseppe Veratti",
                                        city: "Roma",
                                        zip: "00146",
                                        country: "Italia",
                                        country_code: "IT",
                                        type: "HOME"
                                    }
                                ],
                                //birthday: "1990-01-01",
                                emails: [
                                    {
                                        email: "example@example.com",
                                        type: "WORK"
                                    }
                                ],
                                name: {
                                    formatted_name: "Mattia Noris",
                                    first_name: "Mattia",
                                    last_name: "Noris",
                                    //middle_name: "Middle",
                                    //suffix: "Jr.",
                                    //prefix: "Mr."
                                },
                                org: {
                                    company: "Example Company",
                                    department: "Sales",
                                    title: "Manager"
                                },
                                phones: [
                                    {
                                        phone: "+393313869850",
                                        wa_id: "393313869850",
                                        type: "HOME"
                                    }
                                ],
                                urls: [
                                    {
                                        url: "https://www.example.com",
                                        type: "WORK"
                                    }
                                ]
                            }
                        ];
                        Whatsapp.sendContacts(contactsData);
                    }

                    else if (replyId === 'see_info') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        Whatsapp.sendTextMessage('Un momento..')

                    }

                    // The user has prompted to see categories.
                    else if (replyId === 'see_categories') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        Whatsapp.sendTextMessage('Un momento..')

                    }
                            // Making an array for buttons
                            .map(category => ({
                                title: category,
                                id: `category_${category}`
                            }))
                             Selecting only three categories
                            .slice(0, 3);

                        Whatsapp.sendButtonsMessage(responseMessage, listOfButtons);
                    }
                        else if (Whatsapp.getMessage().interactive.type === 'list_reply'){
                            Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                            
                            const selectedProductId = Whatsapp.getMessage().interactive.list_reply.id;
                            console.log(selectedProductId)
                            const respon = Whatsapp.getMessage().interactive.list_reply.title;
                            console.log(respon)
                             if (selectedProductId.startsWith('product_')) {
                            
                                const daysList = getDaysList();
    
                                
                            const listOfSections = [
                                {
                                    title: `20% OFF`,
                                    rows: daysList
                                        .map((product) => {
                                            let id = `day_${product.id}`.substring(0, 256);
                                            let title = product.title;
                                            let description = '';
    
                                            return {
                                                id,
                                                title: `${title}`,
                                                description: `${description}`
                                            };
                                        })
                                        .slice(0, 10)
                                },
                            ];
                            
                                const header = `I nostri giorni disponibili`;
                                const body = `Scegli il giorno in cui vuoi prenotare il servizio.`;
                                const footer = 'Centro estetico Luna';
                            
                                Whatsapp.sendRadioButtons(header, body, footer, listOfSections);
                            }   
                            
                            else if (selectedProductId.startsWith('day_')) {
                                const selectedDate = new Date(respon); // Ottieni la data selezionata dall'ID
                            
                                const availableTimes = getAvailableTimes(selectedDate);
                                const listOfSections = [
                                    {
                                        title: `20% OFF`,
                                        rows: availableTimes
                                            .map((product) => {
                                                let id = `time_${product.id}`;
                                                let title = product.title;
                                                let description = '';
        
                                                return {
                                                    id,
                                                    title: `${title}`,
                                                    description: `${description}`
                                                };
                                            })
                                            .slice(0, 10)
                                    },
                                ];
                            
                                // Prepara il messaggio di risposta con gli orari disponibili
                                const header = `Gli orari disponibili per il ${selectedDate.toLocaleDateString('it-IT')}`;
                                const body = `Scegli l'orario in cui vuoi prenotare il servizio.`;
                                const footer = 'Centro estetico Luna';
                            
                                // Invia gli orari come radio buttons
                                Whatsapp.sendRadioButtons(header, body, footer, listOfSections);
                            }
                            
                            else if (selectedProductId.startsWith('time_')) {
                                // L'utente ha selezionato un orario e ha confermato la prenotazione
                                const selectedTime = respon; // Ottieni l'orario selezionato dall'ID
                            
                                const selectedService = "Pulizia del viso";
                                const selectedPrice = "19.90€";
                            
                                const thankYouMessage = `Grazie per la prenotazione!\nEcco il recap:\n\n- Giorno: 7 marzo 2024\n- Ora: ${selectedTime}\n- Servizio: ${selectedService}\n- Prezzo: ${selectedPrice}\n Ti ricorderemo l'appuntamento 1 ora prima`;
                                
                                const startTime = new Date('07/03/2024');
                                startTime.setHours(parseInt(selectedTime.split(':')[0]), parseInt(selectedTime.split(':')[1]), 0, 0);
                                const endTime = new Date(startTime);
                                endTime.setMinutes(endTime.getMinutes() + 30);
                        
    
                                const listOfButtons = [
                                    {
                                        title: 'Parla con noi',
                                        id: 'speak_to_human',
                                    },
                                    {
                                        title: 'Salva sul calendario',
                                        id: 'save_calendar',
                                    },
                                ];
                                Whatsapp.sendButtonsMessage(thankYouMessage, listOfButtons)                        
                            }
                        } else if (replyId === "save_calendar") {
                            const title = 'Trattamento Viso';
                            const startTime = '2024-03-07T10:00:00'; // Timestamp ISO per l'ora di inizio
                            const endTime = '2024-03-07T10:30:00'; // Timestamp ISO per l'ora di fine
                        
                            const googleCalendarLink = `http://www.google.com/calendar/event?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}`;
                        
                            const message = `Clicca sul seguente link per aggiungere l'evento al calendario:\n${googleCalendarLink}`;
                            
                            Whatsapp.sendTextMessage(message);
                        }
    
    
                        // User has selected a product from the radio list
                        else if (Whatsapp.getMessage().interactive.type === 'list_reply') {
                            Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                            
                            // Extracting The Selected Product ID:
                            const selectedProductId = Whatsapp.getMessage().interactive.list_reply.id;
                        }
    
                        // Customer want to add a product to its cart
                        else if (replyId && replyId.startsWith('add_to_cart_')) {
                            const productId = replyId.split('add_to_cart_')[1];
                            await cart.addProduct({ product_id: productId, recipientPhone: Whatsapp.getRecipientPhoneNumber() });
    
                            let cartItemsCount = cart.listOfItemsInCart({ recipientPhone: Whatsapp.getRecipientPhoneNumber() }).count;
    
                            // Send some buttons
                            const buttonsText = `Your cart has been updated.\nNumber of items in cart: ${cartItemsCount}.\n\nWhat do you want to do next?`;
                            const buttonsList = [{
                                title: 'Checkout 🛍️',
                                id: `checkout`,
                            },
                            {
                                title: 'See more products',
                                id: 'see_categories',
    
                            }];
                            await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                            await Whatsapp.sendButtonsMessage(buttonsText, buttonsList);
                        }
    
                        // Customer want to check out its cart
                        else if (replyId === 'checkout') {
                            let finalBill = cart.listOfItemsInCart({ recipientPhone: Whatsapp.getRecipientPhoneNumber() });
                            let invoiceText = `List of items in your cart:\n`;
    
                            finalBill.products.forEach((item, index) => {
                                let serialNo = index + 1;
                                invoiceText += `\n#${serialNo}: ${item.title} @ $${item.price}`;
                            });
    
                            invoiceText += `\n\nTotal: $${finalBill.total}`;
                            const recipientName = Whatsapp.getRecipientName();
    
                            await Whatsapp.sendTextMessage(invoiceText);
    
                            const buttonsText = `Thank you for shopping with us, ${recipientName}.\n\nYour order has been received & will be processed shortly.`;
                            const buttonsList = [{
                                title: 'See more products',
                                id: 'see_categories',
                            },
                            {
                                title: 'Print my invoice',
                                id: 'print_invoice',
                            }];
    
                            await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                            await Whatsapp.sendButtonsMessage(buttonsText, buttonsList);
                        }
    
                        // Customer want to print its invoice
                        else if (replyId === 'print_invoice') {
                            await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                            const recipientName = Whatsapp.getRecipientName();
    
                            // send invoice in document message
                            const caption = `fake shop invoice #${recipientName}`;
                            const filePath = `./invoice_${recipientName}.pdf`;
    
                            await Whatsapp.sendDocumentMessage(filePath, caption);
                        }
                    }
*/