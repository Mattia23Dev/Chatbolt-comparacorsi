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