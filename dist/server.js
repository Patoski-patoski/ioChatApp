import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
// Loads .env file contents into process.env
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";
const app = express();
const server = createServer(app);
const io = new Server(server);
io.on('connection', (socket) => {
    console.log('A user connected!!');
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
        console.log('message: ', msg);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
app.get('/index.html', (req, res) => {
    res.sendFile(join(dirname(__dirname), 'public', 'index.html'));
});
server.listen((PORT), () => {
    console.log(`Listening live from http://${HOSTNAME}/${PORT}`);
});
