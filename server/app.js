const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const { WebSocketServer } = require('ws')
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { init } = require('./src/utils/WebSocket.js');
const { connectToSecondDatabase } = require('./src/utils/MongoDB.js');
const initializeLeadModel = require('./src/models/lead.js');
const createLeadModel = require('./src/models/lead.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./src/models/user.js');

app.use(express.json());
app.use(cors({
    origin: ["https://chatboltls.netlify.app", "https://leadsystem-commerciale-test.netlify.app", "http://localhost:3000", "https://leadsystem.software", "https://leadsystem-test.netlify.app"],
}));
const server = http.createServer(app);
init(server);
//ssh -p 443 -R0:localhost:9000 -L4300:localhost:4300 qr@a.pinggy.io

//https://chatbolt-comparacorsi-production.up.railway.app/custom-bot
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.info('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
        process.exit(1); // Exit the process with failure
    }
};

const main = () => {
    const port = 9000;
    const wsPort = 9010
    require('./src/routes/index.js')(app);  //? Endpoints are included from here.

    server.listen(port, () =>
        console.info(`Bot is running and listening on port: ${port}`)
    );
}

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email o password non corretti' });
    }
  
    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(400).json({ message: 'Email o password non corretti' });
    }
  
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {});
  
    res.json({ token });
  });

connectToMongoDB().then(main);