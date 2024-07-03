const Chat = require('../models/chat');
const Lead = require('../models/lead');
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

module.exports = router;