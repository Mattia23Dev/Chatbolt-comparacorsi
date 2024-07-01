const mongoose = require('mongoose');
const {Schema} = mongoose;

const chatSchema = new Schema({
  //userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: String, required: true },
  leadId: { type: String, required: true },
  messages: [
    {
      content: { type: String, required: true },
      sender: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  numeroTelefono: {type: String, required: true},
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;