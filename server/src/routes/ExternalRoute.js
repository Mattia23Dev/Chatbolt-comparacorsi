const Chat = require('../models/chat');
const Flow = require('../models/flow');
const Lead = require('../models/lead');
const Project = require('../models/project');
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

// APP CHATBOLT FUNCTIONAL ROUTE
router.post('/create-projects', async (req, res) => {
  const { name, tokenMeta, numeroTelefono, client, clientName } = req.body;

  if (!name || !client) {
    return res.status(400).json({ error: 'Name and client are required' });
  }

  try {
    const newProject = new Project({
      name,
      tokenMeta,
      numeroTelefono,
      client,
      clientName
    });

    await newProject.save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/get-projects', async (req, res) => {
  try {
    const project = await Project.find();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Errore durante la ricerca della chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/project/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const flows = await Flow.find({ projectId: req.params.id });

    res.status(200).json({ project, flows });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/project/:id', async (req, res) => {
  const { name, tokenMeta, numeroTelefono, client, clientName } = req.body;

  if (!name || !client) {
    return res.status(400).json({ error: 'Name and client are required' });
  }

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, tokenMeta, numeroTelefono, client, clientName },
      { new: true } // Questa opzione restituisce il documento aggiornato
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Flusso api

router.post('/create-flow', async (req, res) => {
  const { name, responseTime, prompt, projectId } = req.body;

  if (!name || !responseTime || !prompt || !projectId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const flow = new Flow({
      name,
      responseTime,
      prompt,
      projectId,
    });

    await flow.save();

    res.status(201).json(flow);
  } catch (error) {
    console.error('Error creating flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/flow/:id', async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    res.status(200).json(flow);
  } catch (error) {
    console.error('Error fetching flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/flows/:id', async (req, res) => {
  const { nodes, edges } = req.body;

  try {
    const flow = await Flow.findByIdAndUpdate(
      req.params.id,
      { nodes, edges },
      { new: true }
    );
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    res.status(200).json(flow);
  } catch (error) {
    console.error('Error updating flow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;