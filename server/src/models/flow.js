const mongoose = require('mongoose');
const { Schema } = mongoose;

const nodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {},
  width: { type: Number },
  height: { type: Number },
  selected: { type: Boolean },
  positionAbsolute: {
    x: { type: Number },
    y: { type: Number },
  },
  dragging: { type: Boolean }
});

const edgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String, default: null },
  targetHandle: { type: String, default: null }
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
  promptSaveInfo: { type: String },
  tag: { type: String }
});

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow;