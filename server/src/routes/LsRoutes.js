const express = require('express');
const router = express.Router();
const Trigger = require('../models/trigger');
const Project = require('../models/project');
const Flow = require('../models/flow');
const { processTriggerNode } = require('../utils/UtilsFunction');

router.post('/process-trigger/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const { action, userInfo, ecpId} = req.body;

      const project = await Project.findOne({ client: userId });
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      const trigger = await Trigger.findOne({ clientId: userId, triggerStart: action });
      if (!trigger) {
        return res.status(404).json({ message: 'Trigger not found' });
      }
  
      const flow = await Flow.findById(trigger.flowId);
      if (!flow) {
        return res.status(404).json({ message: 'Flow not found' });
      }

      await processTriggerNode(trigger, userInfo, project.phoneNumberId, flow, project._id, project.client, ecpId);

      res.status(200).json({ message: 'Trigger processed successfully' });
    } catch (error) {
      console.error('Error processing trigger:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  module.exports = router;