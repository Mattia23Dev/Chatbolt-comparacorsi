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
      {"first_name":"","last_name":"","email":"","conversation_summary":"","appointment_date":"", ${project.customFields.map(field => `"${field.name}":""`).join(', ')}}
  
      Assicurati di riempire i campi solo con le informazioni disponibili, lasciando vuoti quelli per cui non ci sono informazioni.
      Per il campo appointment_date, usa sempre il formato DD-MM-YYYY HH:mm.
    `;
  
    return prompt;
  };

const Openai = new OpenAIChat(process.env.OPENAI_API_KEY, "gpt-4o")
let messageQueue = [];
let chatTimers = {};
let isProcessing = false;

const waitAction = (node) => {
    console.log('Aspetto:', node.data.waitingTime)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Waited for ${node.data.waitingTime} seconds`);
        resolve();
      }, node.data.waitingTime * 1000); // Convert to milliseconds
    });
  };
  
  const responseLLM = async (node, messagesContent) => {
    console.log('Chiamo openai per rispondere')
    const replyToUser = await Openai.getOpenAIResponse(messagesContent, node.data.prompt);
    return replyToUser;
  };
  
  const saveInfo = async (node, userInfo) => {
    console.log('Salvo info nel db')
    const savedLead = await saveInfoLeadDb(userInfo);
    console.log('Informazioni del lead salvate/aggiornate:', savedLead);
  };
  
  const saveInfoPrompt = async (node, messagesContent, project) => {
    console.log('Chiamo openai per salvataggio')
    const customPrompt = customPromptSave(project, messagesContent)
    const openAIResponse = await Openai.saveInfoLead(customPrompt, node.data.prompt);
    const extractedInfo = await extractJSONFromOpenAIResponse(openAIResponse);
    return extractedInfo;
  };
  
  const LMMResponse = async (node, replyToUser, sendTextMessage, flow, projectId, clientId, numeroTelefono, io) => {
    console.log('Invio messaggio')
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
    sendTextMessage(replyToUser);

    io.emit('updateChat', chat);
  };

  const processFlowNodes = async (nodes, messagesContent, sendTextMessage, project, numeroTelefono, flow, projectId, clientId, io) => {
    let userInfo = { numeroTelefono };
    let replyToUser = '';
    console.log("Processando il ciclo dei nodi")

    const filteredNodes = nodes.filter(node => node.data.action !== 'waitAction');

    for (const node of filteredNodes) {
      switch (node.data.action) {
        //case 'waitAction':
        //  await waitAction(node);
        //  break;

        case 'saveInfoPrompt':
          const extractedInfo = await saveInfoPrompt(node, messagesContent, project);
          userInfo = { ...userInfo, ...extractedInfo };
          break;
  
        case 'saveInfo':
          await saveInfo(node, userInfo);
          break;
  
        case 'responseLLM':
          replyToUser = await responseLLM(node, messagesContent);
          break;
  
        case 'LMMResponse':
          await LMMResponse(node, replyToUser, sendTextMessage, flow, projectId, clientId, numeroTelefono, io);
          break;
  
        default:
          console.log(`Action ${node.data.action} not recognized.`);
      }
    }
  };

  const processQueue = async () => {
    const io = getIO();
    console.log('Processando')
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
        console.log("Entrando nel ciclo messaggi")
      const phoneNumberId = messages[0].phoneNumberId;
      const existingChat = await getChat({ numeroTelefono });
      const { flow, projectId, clientId, project } = await getFlowByPhoneNumber(phoneNumberId);
  
      if (existingChat && existingChat.active === false) {
        console.log('Non attivo ma salvo');
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
      const messaggiPrompt = `
      Messaggi precedenti
      ${messagesContent}
      `
  
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

      await processFlowNodes(flow.nodes, messaggiPrompt, messages[0].sendTextMessage, project, numeroTelefono, flow, projectId, clientId, io);
  
      isProcessing = false;
      if (messageQueue.length > 0) {
        processQueue();
        //if (debounceTimer) clearTimeout(debounceTimer);
        //debounceTimer = setTimeout(processQueue, 20000); // Questo è un fallback generale, non legato a un flusso specifico
      }
    }
  };
  
  module.exports = router.post('/', async (req, res) => {
    try {
      const data = req.body;
  
      if (data.object) {
        const phoneNumberId = data.entry[0].changes[0].value.metadata.phone_number_id;
        console.log(phoneNumberId);
        const {token, flow} = await getTokenByPhoneNumber(phoneNumberId);
        const isNewMessage = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (isNewMessage) {
          const Whatsapp = new WhatsappCloudAPI({
            data,
            graphApiVersion: 'v20.0',
            token: token,
          });
  
          const numeroTelefono = Whatsapp.getRecipientPhoneNumber();
          const messageId = Whatsapp.getMessage().id;
          const name = Whatsapp.getRecipientName();
  
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

            const waitNode = flow.nodes.find(node => node.type === 'waitNode');
            const waitingTime = waitNode ? waitNode.data.waitingTime : 0;
  
            if (chatTimers[numeroTelefono]) {
                clearTimeout(chatTimers[numeroTelefono]);
            }

            chatTimers[numeroTelefono] = setTimeout(() => {
                processQueue();
            }, waitingTime * 1000);
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
  