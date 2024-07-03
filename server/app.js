const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');

app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      withCredentials: true
    },
  });
//ssh -p 443 -R0:localhost:9000 -L4300:localhost:4300 qr@a.pinggy.io

//https://chatbolt-comparacorsi-production.up.railway.app/whatsapp_callback_url
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
    require('./src/routes/index.js')(app);  //? Endpoints are included from here.

    app.listen(port, () =>
        console.info(`Bot is running and listening on port: ${port}`)
    );
}

io.on('connection', (socket) => {
    console.log('Un utente si è connesso');
  
    socket.on('disconnect', () => {
      console.log('Un utente si è disconnesso');
    });
  
    socket.on('chat message', (msg) => {
      console.log('Messaggio ricevuto: ' + msg);
      io.emit('chat message', msg);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
  });  

connectToMongoDB().then(main);