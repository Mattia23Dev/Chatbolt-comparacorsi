const mongoose = require('mongoose');
const {Schema} = mongoose;

const customFieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: {type: String, required: true},
  value: Schema.Types.Mixed
});

const chatSchema = new Schema({
  //userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: String },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow' },
  clientId: { type: String },
  leadId: { type: String },
  messages: [
    {
      content: { type: String },
      sender: { type: String },
      timestamp: { type: Date, default: Date.now },
      manual: { type: Boolean, default: false}
    }
  ],
  createdAt: { type: Date, default: Date.now },
  numeroTelefono: {type: String, required: true},
  first_name: {type: String },
  last_name: {type: String },
  email: {type: String },
  conversation_summary: {type: String },
  appointment_date: {type: String },
  active: {type: Boolean, default: true},
  favorite: {type: Boolean, default: false},
  customFields: [customFieldSchema],
  tag: { type: String },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;