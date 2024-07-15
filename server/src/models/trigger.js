const mongoose = require('mongoose');
const { Schema } = mongoose;

const triggerSchema = new Schema({
  triggerName: { type: String, required: true },
  triggerStart: { type: String, required: true },
  actionType: { type: String, required: true },
  templateWhatsapp: { type: Schema.Types.Mixed, default: {} },
  templateEmail: { type: Schema.Types.Mixed, default: {} },
  clientId: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
  tag: { type: String, default: '' },
  params: [],
  selectedComponent: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Trigger = mongoose.model('Trigger', triggerSchema);
module.exports = Trigger;