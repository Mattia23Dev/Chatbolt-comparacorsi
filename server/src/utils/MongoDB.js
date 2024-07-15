const mongoose = require('mongoose');
require('dotenv').config();
const Chat = require("../models/chat");
const Lead = require("../models/lead");
const createLeadModel = require('../models/lead');

exports.saveMessageOrChat = async ({userId, leadId, numeroTelefono, content, sender, manual, clientId, flowId, projectId, tag}) => {

    if (!userId || !leadId || !numeroTelefono || !content || !sender) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      let chat = await Chat.findOne({ numeroTelefono, projectId });
  
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

exports.saveInfoLeadDb = async (userInfo, projectId) => {
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

  try {
    let lead = await Chat.findOne({ numeroTelefono, projectId });

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

    if (appointment_date && appointment_date?.trim() !== ""){
      const secondDbConnection = await this.connectToSecondDatabase();  
      const Lead = await createLeadModel(secondDbConnection);
  
      const lead = await Lead.findOne({numeroTelefono: numeroTelefono});
      if (lead){
        lead.appDate = appointment_date;
        lead.summary = conversation_summary;
        if (email && email?.trim() !== ""){
          lead.email = email;
        }
        await lead.save()
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