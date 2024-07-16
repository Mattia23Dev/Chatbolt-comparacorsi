const mongoose = require('mongoose');
require('dotenv').config();
const Chat = require("../models/chat");
const Lead = require("../models/lead");
const createLeadModel = require('../models/lead');
const Project = require('../models/project');
const axios = require('axios');

const findChatByPhoneNumber = (numeroTelefono) => {
  numeroTelefono = numeroTelefono.replace(/\s+/g, '').replace(/[^0-9]/g, '');

  let formattedNumbers = [];
  if (numeroTelefono.length > 10) {
    if (numeroTelefono.startsWith('+39')) {
      formattedNumbers.push(numeroTelefono.replace(/^\+39/, ''));
    } else if (numeroTelefono.startsWith('39')) {
      formattedNumbers.push(numeroTelefono.replace(/^39/, ''));
    }
  } else {
    formattedNumbers.push(numeroTelefono);
  }

  formattedNumbers = [
    ...formattedNumbers,
    '+39' + formattedNumbers[0],
    '39' + formattedNumbers[0]
  ];
  return formattedNumbers
};

exports.saveMessageOrChat = async ({userId, leadId, numeroTelefono, content, sender, manual, clientId, flowId, projectId, tag}) => {

    if (!userId || !leadId || !numeroTelefono || !content || !sender) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  console.log('Salvando')
    try {
      const formattedNumbers = findChatByPhoneNumber(numeroTelefono)
      let chat = await Chat.findOne({
        numeroTelefono: { $in: formattedNumbers },
        projectId
      });
  
      if (chat) {
        chat.messages.push({
          content,
          sender,
          timestamp: new Date(),
          manual: manual ? manual : false,
        });
      } else {
        chat = new Chat({
          userId,
          leadId,
          numeroTelefono,
          clientId,
          flowId,
          projectId,
          tag: tag ? tag : "",
          messages: [{
            content,
            sender,
            timestamp: new Date(),
            manual: manual ? manual : false,
          }]
        });
      }
  
      await chat.save();
  
      return chat;
    } catch (error) {
      console.error('Error saving message:', error);
      return 'error'
    }
}

exports.getChat = async ({numeroTelefono}) => {

  if (!numeroTelefono) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    let chat = await Chat.findOne({ numeroTelefono });

    return chat
  } catch (error) {
    console.error('Error saving message:', error);
    return 'error'
  }
}

exports.getUser = async ({numeroTelefono}) => {

  if (!numeroTelefono) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    let lead = await Lead.findOne({ numeroTelefono });

    return lead
  } catch (error) {
    console.error('Error saving message:', error);
    return 'error'
  }
}

exports.saveInfoLeadDb = async (userInfo, projectId, {noSaveLs}) => {
  const {
    numeroTelefono,
    first_name,
    last_name,
    email,
    conversation_summary,
    appointment_date,
    customFields,
  } = userInfo;
  if (!numeroTelefono) {
    throw new Error('Numero di telefono è obbligatorio');
  }

  const formattedNumbers = findChatByPhoneNumber(numeroTelefono)
  try {
    let lead = await Chat.findOne({
      numeroTelefono: { $in: formattedNumbers },
      projectId
    });
    let project = await Project.findById(projectId)

    if (!project){
      console.log("Progetto non trovato")
    }

    if (lead) {
      lead.first_name = first_name || lead.first_name;
      lead.last_name = last_name || lead.last_name;
      lead.email = email || lead.email;
      lead.conversation_summary = conversation_summary || lead.conversation_summary;
      lead.appointment_date = appointment_date || lead.appointment_date;

      if (customFields && customFields.length > 0) {
        customFields.forEach(customField => {
          const existingFieldIndex = lead.customFields.findIndex(field => field.name === customField.name);
          if (existingFieldIndex >= 0) {
            lead.customFields[existingFieldIndex].value = customField.value;
          } else {
            lead.customFields.push(customField);
          }
        });
      }

      await lead.save();
    } else {
      lead = new Chat({
        numeroTelefono,
        first_name,
        last_name,
        email,
        conversation_summary,
        appointment_date
      });

      await lead.save();
    }

    if (!noSaveLs) {
      if (project?.client === "ECP"){
        console.log("ECP")
      } else if (project?.client === "Bludental"){
        console.log("Bludental")
      } else {
        console.log("Commerciale")
        if (numeroTelefono && conversation_summary && first_name){
          try {
            await axios.post('http://localhost:8001/chatbolt/save-chatbolt-lead', {
              numeroTelefono,
              appointment_date,
              conversation_summary,
              email,
              first_name,
              last_name,
              clientId: project.client,
              canale: "whatsapp",
              leadId: lead._id,
            });
          } catch (error) {
            console.error('Error sending data to the API', error);
          }
          /*const secondDbConnection = await this.connectToSecondDatabase();
          const Lead = await createLeadModel(secondDbConnection);

          const lead = await Lead.findOne({numeroTelefono: numeroTelefono});
          if (lead){
            lead.appDate = appointment_date;
            lead.summary = conversation_summary;
            if (email && email?.trim() !== ""){
              lead.email = email;
            }
            await lead.save()
          }*/
        }      
      }      
    }

    return lead;
  } catch (error) {
    console.error('Errore nel salvare/aggiornare le informazioni del lead:', error);
    throw error;
  }
};

exports.connectToSecondDatabase = async () => {
  const secondDbConnection = mongoose.createConnection(process.env.DB_URL_LEADSYSTEM, { useNewUrlParser: true, useUnifiedTopology: true });

  secondDbConnection.on('connected', () => {
    console.log('Connesso al secondo database');
  });

  secondDbConnection.on('error', error => {
    console.error('Errore di connessione al secondo database:', error);
  });

  return secondDbConnection
};