const mongoose = require('mongoose');
const {Schema} = mongoose;

const leadSchema = new Schema({
  first_name: {type: String },
  last_name: {type: String },
  email: {type: String },
  conversation_summary: {type: String },
  numeroTelefono: {type: String, required: true},
  appointment_date: {type: String },
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;