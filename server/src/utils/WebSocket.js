// io.js
const { Server } = require('socket.io');
let io;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

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

    io.engine.on('connection_error', (err) => {
        console.log(err.req);      // the request object
        console.log(err.code);     // the error code, for example 1
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized. Call init() first.");
    }
    return io;
};

module.exports = { init, getIO };
