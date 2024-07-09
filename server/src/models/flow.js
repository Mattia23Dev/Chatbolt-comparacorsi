const mongoose = require('mongoose');
const { Schema } = mongoose;

const nodeSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: { 
      label: { type: String, required: true }
    },
  });
  
  const edgeSchema = new Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String },
  });

const flowSchema = new Schema({
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdAt: { type: Date, default: Date.now },
  prompt: { type: String },
  flowType: { type: String },
  responseTime: { type: Number },
  nodes: [nodeSchema],
  edges: [edgeSchema],
});

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow;