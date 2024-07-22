const Chat = require('../models/chat');
const Flow = require('../models/flow');
const Lead = require('../models/lead');
const Project = require('../models/project');
const Trigger = require('../models/trigger');
const { saveMessageOrChat } = require('../utils/MongoDB');
const { defaultFlowData } = require('../utils/UtilsData');
const { sendTextMessageOutbound, getMessageTemplates } = require('../utils/WhatsappCloudApi');
const router = require('express').Router();

router.get("/get-all-chats", async (req, res) => {
    try {
      const { ecpId } = req.query;
      console.log(ecpId)
      let chats = await Chat.find({ userId: ecpId.toString() });
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
    const { numeroTelefono, leadId } = req.body;
    
    if (!numeroTelefono) {
      return res.status(400).json({ error: 'numeroTelefono is required' });
    }

    const chat = await Chat.findOne({ leadId: leadId });

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
  const { name, tokenMeta, numeroTelefono, client, clientName, waAccountId, phoneNumberId } = req.body;

  if (!name || !client) {
    return res.status(400).json({ error: 'Name and client are required' });
  }

  try {
    const newProject = new Project({
      name,
      tokenMeta,
      numeroTelefono,
      client,
      clientName,
      phoneNumberId,
      waAccountId
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
  const { name, responseTime, prompt, projectId, promptSaveInfo, tag } = req.body;

  if (!name || !responseTime || !prompt || !projectId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const flow = new Flow({
      name,
      responseTime,
      prompt,
      projectId,
      nodes: defaultFlowData.nodes,
      edges: defaultFlowData.edges,
      promptSaveInfo,
      tag
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

router.post('/flows/:id/get-template', async (req, res) => {
  try {
    const { numeroTelefono } = req.body;
    const project = await Project.findOne({ numeroTelefono: numeroTelefono });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const { waAccountId, tokenMeta } = project;
    const templates = await getMessageTemplates(waAccountId, tokenMeta);

    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/nodes/:flowId/update', async (req, res) => {
  try {
    const { nodeId, type, data } = req.body;
    const flowId = req.params.flowId;
    console.log(data)

    const flow = await Flow.findById(flowId);

    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' });
    }

    const nodeIndex = flow.nodes.findIndex(node => node.id === nodeId);
    const node = flow.nodes[nodeIndex];


    if (nodeIndex === -1) {
      return res.status(404).json({ message: 'Node not found' });
    }

    if (node.type === 'messageNode') {
      node.data.customType = data.messageType || node.data.customType;
      node.data.action = data.messageType || node.data.action;

      if (data.metaTemplate) {
        node.data.metaTemplate = data.metaTemplate;
      }

      if (data.template) {
        node.data.template = data.template;
      }
    } else if (node.type === "waitNode"){
      node.data.waitingTime = data.waitingTime || node.data.waitingTime;
    } else if (node.type === "llmNode"){
      node.data.customType = data.callType || node.data.customType;

      if (node.data.customType === 'response') {
        console.log('ok')
        node.data.action = 'responseLLM';
        node.data.prompt = data.prompt;
      } else if (node.data.customType === 'save') {
        node.data.action = 'saveInfoPrompt';
        node.data.prompt = data.prompt;
      }
    } else if (node.type === 'saveInfoNode') {
      node.data.infoType = data.infoType || node.data.infoType;
    } else {
      console.log('Non trovato')
    }

    flow.nodes[nodeIndex] = node
    const savedFlow = await flow.save();
    console.log('Flow Saved:', savedFlow.nodes[0].data);

    res.json({ message: 'Node updated successfully' });
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/setDefaultFlow', async (req, res) => {
  const { flowId, projectId } = req.body;

  if (!flowId || !projectId) {
    return res.status(400).json({ error: 'flowId e projectId sono obbligatori' });
  }

  try {
    await Flow.findByIdAndUpdate(flowId, { default: true });

    await Flow.updateMany({ projectId, _id: { $ne: flowId } }, { default: false });

    res.status(200).json({ message: 'Flusso di default aggiornato correttamente' });
  } catch (error) {
    console.error('Errore nell\'impostare il flusso di default:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// CUSTOM FIELDS
router.post('/projects/:id/custom-fields', async (req, res) => {
  try {
    const { customFields } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.customFields = customFields;
    await project.save();

    await Chat.updateMany(
      { projectId: projectId },
      { $push: { customFields: { $each: customFields.map(field => ({ ...field, value: '' })) } } }
    );

    res.json(project);
  } catch (error) {
    console.error('Error updating custom fields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//CHATS
router.get('/chats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const chats = await Chat.find({ projectId });

    if (!chats) {
      return res.status(404).json({ message: 'No chats found for this project' });
    }

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/update-contact/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const updatedData = req.body;

      const contact = await Chat.findByIdAndUpdate(id, updatedData, { new: true });

      if (!contact) {
          return res.status(404).json({ message: 'Contact not found' });
      }

      res.json(contact);
  } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

//Trigger
router.post('/create-trigger', async (req, res) => {
  try {
    const {
      triggerStart,
      actionType,
      templateWhatsapp,
      templateEmail,
      clientId,
      projectId,
      flowId,
      tag,
      triggerName
    } = req.body;
    console.log(req.body)

    const newTrigger = new Trigger({
      triggerStart,
      actionType,
      templateWhatsapp,
      templateEmail,
      clientId,
      projectId,
      flowId,
      tag,
      triggerName
    });
    const savedTrigger = await newTrigger.save();

    res.status(201).json(savedTrigger);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Errore nella creazione del trigger.' });
  }
});

router.get('/triggers/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const triggers = await Trigger.find({ projectId });
    res.status(200).json(triggers);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei trigger.' });
  }
});

router.put('/triggers/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedTrigger = await Trigger.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedTrigger) {
      return res.status(404).json({ error: 'Trigger non trovato.' });
    }
    res.status(200).json(updatedTrigger);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella modifica del trigger.' });
  }
});

module.exports = router;