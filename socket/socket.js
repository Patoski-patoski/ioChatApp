// socket/socket.js

import { Server } from 'socket.io';
import {User, Message, SessionUser } from '../models/Users.js';

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
        socket.on('enterRoom', async ({ friendName, currentUser, room }) => {    
            const chatHistory = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit('chatHistory', chatHistory);

            const prevUser = await SessionUser.findOne({ id: socket.id });

            if (prevUser) {
                socket.leave(prevUser.room);
                io.to(prevUser.room).emit('message', buildMsg(ADMIN, `${currentUser} has left the chat`));
                await prevUser.save();
            }

            const user = await activateUser(socket.id, currentUser, room);
            socket.join(user.room);

            // Get number of clients in the room
            const clients = io.sockets.adapter.rooms.get(user.room);

            // If both users are in the room, trigger status update
            if (clients && clients.size === 2) {
                // Trigger status update for both users
                socket.emit('update friend status', clients);
                socket.to(user.room).emit('update friend status');

                const [client_1, client_2] = [...clients];
                try {
                    const sessionUser_1 = await SessionUser.findOne({ id: client_1 });
                    if (!sessionUser_1) {
                        throw new Error("Session user not found");
                    }
                    const currentUser = await User.findOne({ username: sessionUser_1.currentUser });
                    if (!currentUser) {
                        throw new Error("Current user not found");
                    }

                    //  find the friend client/user
                    const sessionUser_2 = await SessionUser.findOne({ id: client_2 });
                    if (!sessionUser_2) {
                        throw new Error("Session user not found");
                    }
                    const friendUser = await User.findOne({ username: sessionUser_2.currentUser });
                    if (!friendUser) {
                        throw new Error("Current user not found");
                    }

                    // Update first client/user
                    await User.updateOne(
                        { _id: currentUser._id, 'friends.userId': friendUser._id },
                        { $set: { 'friends.$.status': 'accepted' } }
                    );

                    // Update second client/user
                    await User.updateOne(
                        { _id: friendUser._id, 'friends.userId': currentUser._id },
                        { $set: { 'friends.$.status': 'accepted' } }
                    );

                } catch (error) {
                    console.error(error);
                    };

            }

            socket.emit('message', buildMsg(ADMIN, `You have started a conversation in ${user.room}`));
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${currentUser} is online`));
        });

        socket.on('disconnect', async () => {
            const user = await SessionUser.findOneAndDelete({ id: socket.id });
            if (user) {
                io.to(user.room).emit('message', buildMsg(ADMIN, `${user.currentUser} is offline`));
               
            }
            console.log(`SessionUser ${socket.id} disconnected`);
        });

        socket.on('message', async ({ friendName, text, currentUser }) => {
            const user = await SessionUser.findOne({ id: socket.id });
            const name = currentUser;
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
    await SessionUser.updateOne({ id }, { $set: user }, { upsert: true });
    return user;
}

export default setupSocketIO;
