const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new Schema({
  name: { type: String, required: true },
  tokenMeta: { type: String },
  numeroTelefono: { type: String },
  client: { type: String, required: true },
  clientName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;