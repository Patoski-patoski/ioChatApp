// import { Server } from 'socket.io';
// import { connectToDataBase } from '../routes/database.js';
// import config from '../config.js';
// import { User, Message } from '../models/users.js';  // Import Mongoose models

// export const ADMIN = 'Admin';

// const setupSocketIO = async (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: process.env.NODE_ENV === 'production'
//         ? ['https://messaging-backend-system.onrender.com/']
//         : ['http://localhost:3000'],
//       credentials: true
//     }
//   });


//   io.on('connection', async (socket) => {
//     console.log(`User ${socket.id} connected`);

//     socket.on('enterRoom', async ({ name, room }) => {
//       const isNameAndRoom = await getUsersAndRoom(name, room);
//       if (isNameAndRoom.length > 0) {
//         await deleteUserAndRooms(name, room);
//       }

//       const prevUser = await getUser(socket.id);
//       if (prevUser) {
//         socket.leave(prevUser.room);
//         io.to(prevUser.room).emit('message', buildMsg(ADMIN, `${name} has left the chat`));
//         await deleteUser(socket.id);
//       }

//       const user = await activateUser(socket.id, name, room);
//       if (prevUser) {
//         io.to(prevUser.room).emit('userList', {
//           users: await getUsersInRoom(prevUser.room)
//         });
//       }

//       socket.join(user.room);

//       const chatHistory = await getChatHistory(room);
//       socket.emit('chatHistory', chatHistory);

//       socket.emit('message', buildMsg(ADMIN, `You have started a conversation at ${user.room}`));
//       socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is online`));

//       io.to(user.room).emit('userList', {
//         users: await getUsersInRoom(user.room)
//       });
//     });

//     socket.on('disconnect', async () => {
//       const user = await getUser(socket.id);
//       await deleteUser(socket.id);

//       if (user) {
//         io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is offline`));
//         io.to(user.room).emit('userList', {
//           users: await getUsersInRoom(user.room)
//         });
//       }
//       console.log(`User ${socket.id} disconnected`);
//     });

//     socket.on('message', async ({ name, text }) => {
//       const user = await getUser(socket.id);
//       if (user) {
//         const messageData = buildMsg(name, text);
//         await saveMessage(user.room, messageData);
//         io.to(user.room).emit('message', messageData);
//       }
//     });

//     socket.on('activity', async (name) => {
//       const user = await getUser(socket.id);
//       if (user) {
//         socket.broadcast.to(user.room).emit('activity', name);
//       }
//     });
//   });

//   return io;
// };

// function buildMsg(name, text) {
//   return {
//     name,
//     text,
//     time: new Intl.DateTimeFormat('default', {
//       hour: 'numeric',
//       minute: 'numeric',
//       hour12: true
//     }).format(new Date()),
//     timestamp: new Date()
//   };
// }

// async function saveMessage(room, messageData) {
//   await Message.create({ room, ...messageData });
// }

// async function getChatHistory(room) {
//   return await Message.find({ room }).sort({ timestamp: 1 });
// }

// async function activateUser(id, name, room) {
//   const user = { id, name, room };
//   await User.findOneAndUpdate(
//     { id: id },
//     user,
//     { upsert: true, new: true }
//   );
//   return user;
// }

// async function getUser(id) {
//   return await User.findOne({ id: id });
// }

// async function getUsersInRoom(room) {
//   return await User.find({ room: room });
// }

// async function getUsersAndRoom(room, name) {
//   return await User.find({ room: room, name: name });
// }

// async function getAllActiveRooms() {
//   return await User.distinct('room');
// }

// async function deleteUser(id) {
//   return await User.deleteOne({ id: id });
// }

// async function deleteUserAndRooms(name, room) {
//   return await User.deleteMany({ room: room, name: name });
// }

// export default setupSocketIO;
