const Chat = require("../models/chat");
const Lead = require("../models/lead");

exports.saveMessageOrChat = async ({userId, leadId, numeroTelefono, content, sender}) => {

    if (!userId || !leadId || !numeroTelefono || !content || !sender) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      let chat = await Chat.findOne({ numeroTelefono });
  
      if (chat) {
        chat.messages.push({
          content,
          sender,
          timestamp: new Date()
        });
      } else {
        chat = new Chat({
          userId,
          leadId,
          numeroTelefono,
          messages: [{
            content,
            sender,
            timestamp: new Date()
          }]
        });
      }
  
      await chat.save();
  
      return 'Message saved successfully'
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

exports.saveInfoLeadDb = async ({ 
  numeroTelefono, 
  first_name, 
  last_name, 
  email, 
  conversation_summary, 
  appointment_date 
}) => {
  if (!numeroTelefono) {
    throw new Error('Numero di telefono è obbligatorio');
  }

  try {
    let lead = await Lead.findOne({ numeroTelefono });

    if (lead) {
      lead.first_name = first_name || lead.first_name;
      lead.last_name = last_name || lead.last_name;
      lead.email = email || lead.email;
      lead.conversation_summary = conversation_summary || lead.conversation_summary;
      lead.appointment_date = appointment_date || lead.appointment_date;

      await lead.save();
    } else {
      lead = new Lead({
        numeroTelefono,
        first_name,
        last_name,
        email,
        conversation_summary,
        appointment_date
      });

      await lead.save();
    }

    return lead;
  } catch (error) {
    console.error('Errore nel salvare/aggiornare le informazioni del lead:', error);
    throw error;
  }
};