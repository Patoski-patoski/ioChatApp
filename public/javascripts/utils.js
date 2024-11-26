import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { User } from '../../models/Users.js'
import {SALT_ROUNDS} from './constants.js';

function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}


export async function checkFriendStatus(currentUser, friendUser) {
  const isPending = currentUser.friends.some(
    (friend) =>
      friend.userId.equals(friendUser._id) && friend.status === 'pending'
  );
  const isPending_2 = friendUser.friends.some(
    (friend) =>
      friend.userId.equals(currentUser._id) && friend.status === 'pending'
  );

  const isAccepted = currentUser.friends.some(
    (friend) =>
      friend.userId.equals(friendUser._id) && friend.status === 'accepted'
  );

  return { isPending, isAccepted, isPending_2 };
}

export function generateRoomCode(userId, username) {
  console.log(`${userId.slice(-7)}-${generateRandomString(SALT_ROUNDS)}-${username}`);
  return `${userId.slice(-7)}-${generateRandomString(SALT_ROUNDS)}-${username}`;
}

// Separate email template creation
export function createFriendRequestEmailTemplate({ currentUser, _friendUsername, uniqueCode }) {
    return `
    <h2>New Friend Request</h2>
    <p>Hello! You have received a friend request from <b>${currentUser}</b> on ioChatApp.</p>
    <p>If you recognize this user and want to accept their request, please use this unique code:</p>
    <h3>${uniqueCode}</h3>
    <p>To accept the request:</p>
    <ol>
        <li>Open ioChatApp</li>
        <li>Go to "Add friends"</li>
        <li>Enter the username <b>${currentUser}</b></li>
        <li>Enter this unique code</li>
    </ol>
    <p>If you don't recognize this user, you can safely ignore this email.</p>`;
}


// Separate email sending function
export async function sendFriendRequestEmail({ to, template }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: process.env.NODE_ENV === 'production',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'ioChatApp Friend Request',
      html: template
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function updateOne(currentUser, friendUser, uniqueCode) {
  await Promise.all([
    User.updateOne(
      { _id: currentUser._id },
      {
        $push: {
          friends: {
            userId: friendUser._id,
            status: "pending",
            roomCode: uniqueCode
          }
        }
      }
    ),
    User.updateOne(
      { _id: friendUser._id },
      {
        $push: {
          friends: {
            userId: currentUser._id,
            status: "pending",
            roomCode: uniqueCode
          }
        }
      }
    )
  ]);
}