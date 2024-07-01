const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
app.use(express.json());
//ssh -p 443 -R0:localhost:9000 -L4300:localhost:4300 qr@a.pinggy.io

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

connectToMongoDB().then(main);