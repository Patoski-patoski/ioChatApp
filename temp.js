// router.post('/add_friend', isAuthenticated, async (req, res) => {
//   try {
//     await connectToDataBase();
//     const client = getClient();
//     const db = client.db("chatapp");
//     const usersCollection = db.collection("users");

//     const { sendUsername, receipientEmail } = req.body;

//     const sender = await usersCollection.findOne({ username: sendUsername });
//     const recipient = await usersCollection.findOne({ email: receipientEmail });

//     if (!sender) {
//       return res.status(HTTP_STATUS.NOT_FOUND).json({
//         message: 'Sender not found'
//       });

//     }
//     if (recipient) {
//       const existingFriends = sender.friends.find(
//         friend => friend.userId.toString() === recipient._id.toString()
//       );
//       if (existingFriends) return res.status(HTTP_STATUS.NOT_FOUND).json({
//         message: 'Already friends or request pending'
//       });
//     }

//     // Send email
//     const emailTemplate = `
//             <h2>New Friend Request</h2>
//             <p>Hello! You have received a friend request from ${senderUsername} on ioChatApp.</p>
//             <p>If you recognize this user and want to accept their request, please use this room code:</p>
//             <h3>${roomCode}</h3>
//             <p>To accept the request:</p>
//             <ol>
//                 <li>Open ChatApp</li>
//                 <li>Go to "Accept Friend Request"</li>
//                 <li>Enter this room code</li>
//             </ol>
//             <p>If you don't recognize this user, you can safely ignore this email.</p>`;

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: recipientEmail,
//       subject: `Friend Request from ${senderUsername} on ioChatApp`,
//       html: emailTemplate
//     })


//     // If recipient exists in database, add pending friend
//     if (recipient) {
//       sender.friends.push({
//         userId: recipient._id,
//         status: 'pending',
//         roomCode
//       });
//       await sender.save();
//     }

//     res.json({
//       success: true,
//       message: 'Friend request sent successfully',
//       roomCode
//     });
//   } catch (error) {
//     console.error('Error sending friend request:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send friend request'
//     });
//   }

// });