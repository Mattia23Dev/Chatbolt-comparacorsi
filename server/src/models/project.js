const mongoose = require('mongoose');
const { Schema } = mongoose;

const customFieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }
});

const projectSchema = new Schema({
  name: { type: String, required: true },
  tokenMeta: { type: String },
  numeroTelefono: { type: String },
  phoneNumberId: { type: String },
  client: { type: String, required: true },
  clientName: { type: String },
  createdAt: { type: Date, default: Date.now },
  waAccountId: { type: String },
  customFields: [customFieldSchema],
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;