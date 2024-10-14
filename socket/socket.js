// socket/socket.js

import { Server } from 'socket.io';
import { redisClient } from '../routes/database.js';

const setupSocketIO = (server) => {
    const io = new Server(server);

    io.on('connection', async (socket) => {
        console.log('A user connected!!');

        const userId = socket.handshake.auth.token;
        await redisClient.set(`user:${userId}:status`, 'online');

        socket.on('chat message', (msg) => {
            io.emit('chat message', msg);
            console.log('message: ', msg);
        });
        socket.on('disconnect', async () => {
            console.log('User disconnected');
            await redisClient.select(`user:${userId}:status`, 'offline');
        });
    });
    return io;
};

export default setupSocketIO;
