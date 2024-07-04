const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const { WebSocketServer } = require('ws')
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { init } = require('./src/utils/WebSocket.js');

app.use(express.json());
app.use(cors());
const server = http.createServer(app);
init(server);
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
    const wsPort = 9010
    require('./src/routes/index.js')(app);  //? Endpoints are included from here.

    server.listen(port, () =>
        console.info(`Bot is running and listening on port: ${port}`)
    );
}

connectToMongoDB().then(main);