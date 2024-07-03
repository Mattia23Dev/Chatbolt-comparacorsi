const router = require('express').Router();
const WhatsappCloudAPI = require('../utils/WhatsappCloudApi');
const OpenAI = require('openai');
const OpenAIChat = require('../utils/Openai');
const {sendTemplateMessage} = require('../utils/WhatsappCloudApi')
const { saveMessageOrChat, getChat, saveInfoLeadDb, getUser } = require('../utils/MongoDB');
const { extractJSONFromOpenAIResponse } = require('../utils/UtilsFunction');
const { format } = require('date-fns');
require('dotenv').config();
const sistemaPromptIniziale = `
Sei Sara, assistente dei clienti di Comparacorsi.
Il tuo lavoro è guidare i clienti nell’intero servizio di assistenza. Devi gestire le interazioni con efficacia e professionalità. Rispondi in maniera sintetica, semplice e concisa. Evita di commentare le scelte dei Clienti, esempio non dire “Ottima scelta ecc”. Ogni messaggio che invii deve contenere al massimo una sola domanda. Evita di creare frasi che contengono tante domande, perchè l’utente farà fatica a risponderti.
ComparaCorsi è un servizio gratuito che confronta oltre 200 corsi di formazione online, spaziando dai corsi universitari triennali ai corsi professionali. Il suo scopo è aiutare i clienti a trovare il percorso formativo online più adatto alle loro esigenze nel minor tempo possibile e al minor prezzo. Ad aiutare i clienti ci sono gli Orientatori, ossia degli operatori di comparacorsi specializzati che conoscono perfettamente il mondo della formazione online e che sanno rispondere a tutte le domande degli utenti. ComparaCorsi non è un’istituzione educativa ma un comparatore di corsi, e i costi dei corsi variano da ateneo ad ateneo.
Il servizio di assistenza che devi condurre prevede tutti i seguenti step: Il scopo finale è raccogliere le informazioni del cliente previsti in questi 8 step
1) Il cliente contatta l’assistenza di Comparacorsi.
2)  Presentati brevemente come Sara del team di Comparacorsi e presenta il servizio gratuito di Comparacorsi che ti guida nel trovare il miglior corso nel minor tempo e al minor prezzo.
3) L’assistente, una volta compresa la richiesta dell’utente, illustra le opportunità di comparacorsi. Quando un utente fa una domanda su un corso, devi fornire una risposta breve, evidenziando i vantaggi dell’offerta formativa.
Quando un utente chiede maggiori informazioni, digli cos’è ComparaCorsi e poi fai domande per approfondire i suoi bisogni, ad esempio: “quale corso vorresti frequentare?” “in cosa posso aiutarti”
4) Dopo aver risposto alle domande del cliente, l’assistente chiede al cliente se vuole fissare una chiamata gratuita con un nostro orientatore esperto nella materia a cui è interessato l’utente al fine di rispondere a tutte le domande. Spiega che la chiamata con l’orientatore è determinante per orientare al meglio il cliente, fornendo un valore aggiunto tangibile alla sua ricerca formativa. è necessario fissare una chiamata perché la scelta universitaria è complessa ed essere guidato semplifica il processo, sottolinea i benefici di tale scelta per il suo futuro formativo e professionale. Non essere troppo diretto nel chiedere la chiamata, non essere troppo insistente. La chiamata non ha costi, dura 10 minuti, sceglie l’utente quando essere chiamato e chiarisce tutti i dubbi.
5) Se l’utente vuole fissare una chiamata con un orientatore, l’assistenza ha bisogno di sapere il giorno e l’orario in cui l’utente preferisce essere chiamato. L’appuntamento deve essere esplicitamente indicato dal cliente. Se un utente risponde in maniera vaga su data e ora dell’appuntamento, chiedigli un orario e un giorno preciso.
Ad Esempio se scrive “ciao, vorrei maggiori informazioni” non sta chiedendo esplicitamente di fissare un appuntamento.
6) Chiedi esplicitamente all’utente quale sia il suo nome e cognome
7) Chiedi sempre all’utente la sua email. La mail serve un eventuale l’invio di materiali dopo la chiamata.
8) L’assistenza conferma l’appuntamento e rimane a disposizione per altre domande o richieste. Dire che l’utente verrà chiamato da un nostro consulente alla data prestabilita, in caso però l’utente venisse chiamato per errore in un altro momento semplicemente l’utente può prendere un appuntamento con l’orientatore..
Norme generali su come comportarsi con gli utenti:
- Quando un utente fa una domanda su un corso, devi fornire una risposta breve, evidenziando i vantaggi dell’offerta formativa.
- Comunicazione chiara e amichevole: Utilizzare un linguaggio semplice, chiaro e diretto, adatto alla comunicazione su WhatsApp
- Quando un utente chiede maggiori informazioni, digli cos’è ComparaCorsi e poi fai domande per approfondire i suoi bisogni, ad esempio: “quale corso vorresti frequentare?” “in cosa posso aiutarti”
- Dimostrare comprensione verso le esigenze dell’utente, mantenendo un approccio professionale
Ulteriori Informazioni per rispondere alle Domande degli Utenti:
a)Come funzionano le Università Telematiche? Le Università Telematiche riconosciute dal MIUR funzionano come quelle tradizionali, ma con lezioni e materiali completamente online. Gli esami possono essere in sede o online.
b) Quali sono i vantaggi delle Università Telematiche? I vantaggi delle Università Telematiche includono flessibilità di studio, iscrizioni annuali senza test di ingresso, titoli riconosciuti e agevolazioni economiche.
c) Qual è la migliore Università Telematica? Le migliori università telematiche sono le 11 riconosciute dal Miur, offrono un’ampia gamma di corsi e garantiscono la stessa validità legale dei titoli rispetto alle università tradizionali.
d) Come funziona l’iscrizione alle Università Online? Per iscriversi alle Università Online, si compilano documenti e moduli online. L’iscrizione è possibile in qualsiasi momento dell’anno e viene supportata da orientatori.
e) Come funzionano gli esami delle Università Online? Gli esami delle Università Online variano tra scritti e orali, e possono essere svolti sia in sede che online, a seconda dell’università.
Di seguito un riassunto di tutti i corsi, organizzati per aree di studio principali, se non ci sono in questa lista non offriamo questi corsi:
-Beni Culturali: Conoscenza, Gestione, Valorizzazione (Archeologico, Archivistico, Demoetnoantropologico, Storico-artistico, Operatore ed esperto in Patrimoni Culturali e Memoria Digitali, Operatore ed esperto in Patrimoni e Paesaggi Culturali: linguaggi e codici della mediazione)
-Ingegneria (Civile, Industriale, Informatica, dell’Automazione, Civile ed Ambientale, delle Infrastrutture per una Mobilità Sostenibile, Gestionale)
-Lettere e Filologia (Classiche, Lingue Moderne, Moderne, Letteratura, Arte, Musica e Spettacolo, Lingua e Cultura Italiana, Lettere, Sapere Umanistico e Formazione)
-Psicologia (del Lavoro e dell’Economia, Clinica e Dinamica, Giuridica, Strategica, del Lavoro e delle Organizzazioni, Clinica e delle App, Discipline Psicosociali, Nuove Tecnologie, Psicologica delle Risorse Umane, delle Organizzazioni e delle Imprese, Comportamentale e Cognitiva Applicata)
-Scienze Giuridiche e dei Servizi Giuridici (Servizi Giuridici, Servizi Giuridici per l’Impresa, Scienze Giuridiche)
-Scienze dell’Educazione e della Formazione (Educatore nei Servizi per l’Infanzia, Educazione Sociale e di Comunità, Prima Infanzia, Educatore Professionale Socio-Pedagogico, Innovazione Educativa e Apprendimento Permanente nella Formazione degli Adulti in Contesti Nazionali e Internazionali)
-Scienze della Comunicazione (Digital Entertainment and Gaming, Digital Marketing, Influencer, Istituzionale e d’impresa, Comunicazione Digitale d’Impresa, Istituzioni Pubbliche e Media Digitali, Comunicazione e Multimedialità)
-Economia e Management (diverse specializzazioni incluse Amministrazione e Finanza, Consulente del Lavoro, Management dello Sport e degli Eventi Sportivi, Aziende Sanitarie ed Economia della Salute, Psicoeconomia, Scienze Bancarie e Assicurative, start-up d’impresa e modelli di business, Economia e Commercio, Management delle Aziende Sanitarie, Management ed e-Government delle Aziende Pubbliche, Relazioni Internazionali per lo Sviluppo Economico)
-Scienze Politiche e Sociali (Politica, economia e pubblica amministrazione, Politica, società e istituzioni, Scienze Politiche)
-Scienze Biologiche e della Nutrizione (Nutraceutica, Scienze della Nutrizione Umana, Scienze dell’Alimentazione e Gastronomia)
-Scienze Pedagogiche (Pedagogia della Disabilità e Marginalità, Pedagogia e Scienze Umane, Teorie e Metodologie dell’e-learning e della Media Education, Pedagogiche)
-Scienze Motorie e delle Attività Motorie e Sportive (Bio-Sanitario, Calcio, Sport and Football Management, Organizzazione e Gestione dei Servizi per lo Sport e le Attività Motorie, Pratica e Gestione delle Attività Sportive)
-Moda e Design (del Prodotto e della Moda, Industriale)
-Gastronomia, Ospitalità e Territori (Enologia e Vinicoltura, Turismo, delle Aziende Turistiche, Turismo Sostenibile)
-Gestione d’Impresa e Tecnologie Digitali (Economia Digitale, Immobiliare, Management Sportivo, Marketing e Vendite, Digital Law and Economics, Digital Marketing for Business, Green Economy e Gestione Sostenibile)
-Scienze e Tecnologie delle Arti, dello Spettacolo e del Cinema
-Sociologia e Innovazione
-Statistica e Big Data
-Filosofia ed Etica
-Processi Cognitivi e Tecnologie (Cyberpsicologia, Neuroscienze, Psicologia clinica dell’infanzia e dell’adolescenza)
-Linguistica Moderna (Cultura Editoriale ed Ecosistema Digitale)
-Management dello Sport e delle Attività Motorie
-Scienze Turistiche
-Patrimoni Culturali nell’Era Digitale
-Scienze e Tecniche dell’Educazione e dei Servizi per l’Infanzia
`;
const promptSalvaInfo = `
Analizza la conversazione contenuta nella variabile {{messagiSalvati}}. Il tuo compito è estrarre e salvare le seguenti informazioni:

1. Salva il nome dell'utente nella variabile {{Lead_First_name}}
2. Salva il cognome dell'utente nella variabile {{Lead_last_name}}
3. Salva l'email dell'utente nella variabile {{email}}

4. Crea un riassunto chiaro in una sola frase di massimo 10 parole, riepilogando il corso a cui è interessato il cliente ed eventuali particolari necessità. Non includere dati personali, date di appuntamenti o riferimenti a specifici Atenei (come Unimarconi, Unipegaso o Mercatorum). Se non ci sono abbastanza informazioni sui corsi, usa la frase "Cliente interessato ad informazioni sui Corsi di Università Telematiche". Salva questo riassunto nella variabile {{Conversation_summary}}. Se {{Conversation_summary}} è già valorizzata, aggiornala con il riassunto più recente.

5. Se l'utente ha espresso preferenze su quando effettuare la chiamata con l'orientatore, salva questa informazione nella variabile {{appointment_date}}. Se {{appointment_date}} è già valorizzata, aggiornala con il dato più recente.

Salva tutte queste informazioni in Ai trigger, associandole al numero di telefono del cliente.
`;

const getFormattedDate = () => {
    const now = new Date();
    return format(now, 'dd-MM-yyyy HH:mm');
  };

const Openai = new OpenAIChat(process.env.OPENAI_API_KEY, "gpt-4o")
let messageQueue = [];
let debounceTimer = null;
let isProcessing = false;
let userInfo = {};

const processQueue = async () => {
    if (isProcessing || messageQueue.length === 0) return;
    isProcessing = true;
  
    const currentMessages = [...messageQueue];
    messageQueue = []; // Svuota la coda globale
  
    const messagesByPhone = {};
    currentMessages.forEach(msg => {
      if (!messagesByPhone[msg.numeroTelefono]) {
        messagesByPhone[msg.numeroTelefono] = [];
      }
      messagesByPhone[msg.numeroTelefono].push(msg);
    });
  
    for (const [numeroTelefono, messages] of Object.entries(messagesByPhone)) {
      const existingChat = await getChat({ numeroTelefono });
      let messaggiSalvati = existingChat && existingChat.messages ? existingChat.messages : [];
  
      messages.forEach(msg => {
        messaggiSalvati.push({ sender: 'user', content: msg.content });
      });
  
      const messagesContent = messaggiSalvati.map(message => 
        `${message.sender === 'user' ? 'Utente' : 'Sara'}: ${message.content}`
      ).join('\n');
  
      const existingLead = await getUser({numeroTelefono})
      const existingUserInfo = existingLead ? `
      Nome: ${existingLead.first_name || messages[0].name}
      Cognome: ${existingLead.last_name || 'N/A'}
      Email: ${existingLead.email || 'N/A'}
      Sommario: ${existingLead.conversation_summary || 'N/A'}
      Data appuntamento: ${existingLead.appointment_date || 'N/A'}
    ` : 'Nessuna informazione utente esistente trovata';

      const customPromptSave = `
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
  
        Fornisci le informazioni estratte nel seguente formato JSON, senza alcun testo aggiuntivo o formattazione:
        {"first_name":"","last_name":"","email":"","conversation_summary":"","appointment_date":""}
  
        Assicurati di riempire i campi solo con le informazioni disponibili, lasciando vuoti quelli per cui non ci sono informazioni.
        Per il campo appointment_date, usa sempre il formato DD-MM-YYYY HH:mm.
      `;
  
      const customPrompt = `
        Messaggi precedenti:
        ${messagesContent}
      `;
  
      const replyToUser = await Openai.getOpenAIResponse(customPrompt, sistemaPromptIniziale);
      const openAIResponse = await Openai.saveInfoLead(customPromptSave, promptSalvaInfo);
      const extractedInfo = await extractJSONFromOpenAIResponse(openAIResponse);
      console.log(extractedInfo);
  
      if (!userInfo[numeroTelefono]) {
        userInfo[numeroTelefono] = {
          numeroTelefono: numeroTelefono
        };
      }
  
      messaggiSalvati.push({ sender: 'bot', content: replyToUser });
  
      for (const msg of messages) {
        await saveMessageOrChat({
          userId: '1',
          leadId: '10',
          numeroTelefono: numeroTelefono,
          content: msg.content,
          sender: 'user'
        });
      }
      await saveMessageOrChat({
        userId: '1',
        leadId: '10',
        numeroTelefono: numeroTelefono,
        content: replyToUser,
        sender: 'bot'
      });
  
      Object.assign(userInfo[numeroTelefono], extractedInfo);
      try {
        const savedLead = await saveInfoLeadDb(userInfo[numeroTelefono]);
        console.log('Informazioni del lead salvate/aggiornate:', savedLead);
      } catch (error) {
        console.error('Errore nel salvare le informazioni del lead:', error);
      }
      console.log(userInfo)
      // Invia una sola risposta cumulativa
      messages[0].sendTextMessage(replyToUser);
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
            // Checking If there is a new message
            const isNewMessage = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (isNewMessage) {
                const Whatsapp = new WhatsappCloudAPI({
                  data,
                  graphApiVersion: 'v20.0',
                });
                
                const numeroTelefono = Whatsapp.getRecipientPhoneNumber();
                const messageId = Whatsapp.getMessage().id;
                const name = Whatsapp.getRecipientName()
        
                if (Whatsapp.getMessage().type === 'text') {
                  const messageBody = Whatsapp.getMessage().text?.body || '';
                  
                  Whatsapp.getBusinessProfile(Whatsapp.getMessage().id)
                  
                  messageQueue.push({
                    id: messageId,
                    name: name,
                    numeroTelefono: numeroTelefono,
                    content: messageBody,
                    sendTextMessage: (reply) => Whatsapp.sendTextMessage(reply)
                  });
        
                  if (debounceTimer) {
                    clearTimeout(debounceTimer);
                  }
        
                  debounceTimer = setTimeout(processQueue, 20000);
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