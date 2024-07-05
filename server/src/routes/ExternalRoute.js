const Chat = require('../models/chat');
const Lead = require('../models/lead');
const { saveMessageOrChat } = require('../utils/MongoDB');
const { sendTextMessageOutbound } = require('../utils/WhatsappCloudApi');
const router = require('express').Router();

router.get("/get-all-chats", async (req, res) => {
    try {
        let chats = await Chat.find();
        res.status(200).json({
          message: 'ok',
          success: true,
          chats: chats,
        });
    } catch (error) {
        console.error('Error retrieving chats:', error);
        res.status(500).json({
          message: 'Errore nel recupero delle chat',
          success: false,
          error: error.message
        });
    }
});

router.post('/updateChatStatus', async (req, res) => {
  try {
    const { numeroTelefono, newStatus } = req.body;
    console.log(req.body)
    const chat = await Chat.findOne({numeroTelefono: numeroTelefono});
    if (chat) {
      chat.active = newStatus;
      await chat.save()
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }    
  } catch (error) {
    console.error(error)
  }
});

router.post('/updateChatFavorite', async (req, res) => {
  try {
    const { numeroTelefono, newStatus } = req.body;
    const chat = await Chat.findOne({numeroTelefono: numeroTelefono});
    if (chat) {
      chat.favorite = newStatus;
      await chat.save()
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }    
  } catch (error) {
    console.error(error)
  }
});

router.post('/sendWhatsappMessage', async (req, res) => {
  try {
    const { numeroTelefono, textMessage } = req.body;
    console.log(req.body)
    const response = await sendTextMessageOutbound(numeroTelefono, textMessage)
    if (response === true){
      res.json({ success: true })

      await saveMessageOrChat({
        userId: '1',
        leadId: '10',
        numeroTelefono: numeroTelefono,
        content: textMessage,
        sender: 'bot',
        manual: true,
      });
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    console.error(error)
  }
})

router.post('/get-lead-chat', async (req, res) => {
  try {
    const { numeroTelefono } = req.body;
    
    if (!numeroTelefono) {
      return res.status(400).json({ error: 'numeroTelefono is required' });
    }

    const chat = await Chat.findOne({ numeroTelefono });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Errore durante la ricerca della chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;