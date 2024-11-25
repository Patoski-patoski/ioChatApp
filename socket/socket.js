// socket/socket.js

import { Server } from 'socket.io';
import config from '../config.js';
import { User, Message, SessionUser } from '../models/users.js';

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
        console.log(`Session User ${socket.id} connected`);

        socket.on('enterRoom', async ({friendName, currentUser, room }) => {

            const chatHistory = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit('chatHistory', chatHistory);

            const prevUser = await SessionUser.findOne({ id: socket.id });

            if (prevUser) {
                socket.leave(prevUser.room);
                io.to(prevUser.room).emit('message', buildMsg(ADMIN, `${currentUser} has left the chat`));
                await prevUser.save();
                io.to(prevUser.room).emit('userList', {
                    users: await SessionUser.find({ room: prevUser.room })
                });
            }

            const user = await activateUser(socket.id, currentUser, room);
            socket.join(user.room);

            socket.emit('message', buildMsg(ADMIN, `You have started a conversation in ${user.room}`));
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.currentUser} is online`));
            io.to(user.room).emit('userList', {
                users: await SessionUser.find({ room: user.room })
            });
        });

        socket.on('disconnect', async () => {
            const user = await SessionUser.findOneAndDelete({ id: socket.id });
            console.log('delete', user);
            if (user) {
                io.to(user.room).emit('message', buildMsg(ADMIN, `${user.currentUser} is offline`));
                io.to(user.room).emit('userList', {
                    users: await SessionUser.find({ room: user.room })
                });
            }
            console.log(`SessionUser ${socket.id} disconnected`);
        });

        socket.on('message', async ({ friendName, text, currentUser }) => {
            const user = await SessionUser.findOne({ id: socket.id });
            const name = currentUser;
            console.log("On message name", name);
            if (user) {
                const messageData = buildMsg(name, text);
                await new Message({ room: user.room, ...messageData }).save();
                io.to(user.room).emit('message', messageData);
            }
        });

        socket.on('activity', async (name) => {
            const user = await SessionUser.findOne({ id: socket.id });
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

async function activateUser(id, currentUser, room) {
    const user = { id, currentUser, room };
    console.log('activate user currentuser', currentUser);
    console.log('user.currentuser', user.currentUser);
    console.log('activate user id', id);
    console.log('user.id', user.id);
    
    await SessionUser.updateOne({ id }, { $set: user }, { upsert: true });
    return user;
}

export default setupSocketIO;
