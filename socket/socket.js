// socket/socket.js

import { Server } from 'socket.io';
import config from '../config.js';
import { User, Message } from '../models/users.js';

export const ADMIN = 'Admin';

const setupSocketIO = async (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://messaging-backend-system.onrender.com/']
                : ['http://localhost:3000'],
            credentials: true
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User ${socket.id} connected`);

        socket.on('enterRoom', async ({ name, room }) => {
            
            const existingUser = await User.findOne({ name, room });
            console.log('existingUser', existingUser);
            
            if (existingUser) {
                await User.deleteMany({ name, room });
            }

            const prevUser = await User.findOne({ id: socket.id });
            console.log('prevUser', prevUser);

            if (prevUser) {
                socket.leave(prevUser.room);
                io.to(prevUser.room).emit('message', buildMsg(ADMIN, `${prevUser.name} has left the chat`));
                await User.deleteOne({ id: socket.id });
                io.to(prevUser.room).emit('userList', {
                    users: await User.find({ room: prevUser.room })
                });
            }

            const user = await activateUser(socket.id, name, room);
            socket.join(user.room);

            const chatHistory = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit('chatHistory', chatHistory);

            socket.emit('message', buildMsg(ADMIN, `You have started a conversation in ${user.room}`));
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is online`));
            io.to(user.room).emit('userList', {
                users: await User.find({ room: user.room })
            });
        });

        socket.on('disconnect', async () => {
            const user = await User.findOneAndDelete({ id: socket.id });
            if (user) {
                io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is offline`));
                io.to(user.room).emit('userList', {
                    users: await User.find({ room: user.room })
                });
            }
            console.log(`User ${socket.id} disconnected`);
        });

        socket.on('message', async ({ name, text }) => {
            const user = await User.findOne({ id: socket.id });
            if (user) {
                const messageData = buildMsg(name, text);
                await new Message({ room: user.room, ...messageData }).save();
                io.to(user.room).emit('message', messageData);
            }
        });

        socket.on('activity', async (name) => {
            const user = await User.findOne({ id: socket.id });
            if (user) {
                socket.broadcast.to(user.room).emit('activity', name);
            }
        });
    });

    return io;
};

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(new Date()),
        timestamp: new Date()
    };
}

async function activateUser(id, name, room) {
    const user = { id, name, room };
    await User.updateOne({ id }, { $set: user }, { upsert: true });
    return user;
}

export default setupSocketIO;
