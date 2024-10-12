// socket/socket.js

import { Server } from 'socket.io';

const setupSocketIO = (server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('A user connected!!');

        socket.on('chat message', (msg) => {
            io.emit('chat message', msg);
            console.log('message: ', msg);
        });
        socket.join()
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
    return io;
};

export default setupSocketIO;
