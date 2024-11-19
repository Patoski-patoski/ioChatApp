//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput } from "../middleware/validation.js";
import { validateLoginInput } from "../middleware/validation.js";
import { redisClient } from './database.js';
import nodemailer from 'nodemailer';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";
import isAuthenticated from "../middleware/auth.js";
import { User } from '../models/users.js';

const router = Router();

/* GET home page. */
router.get('/', (_req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
});
router.get('/signup', (_req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'signup.html'));
});

router.get('/login', (_req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'login.html'));
});

router.post('/signup', validateSignupInput, async (req, res, next) => {
  const { username, sex, password, email } = req.body;

  try {

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        { error: 'Username already exists. Please choose another.' });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await User.create({
      username,
      sex,
      email,
      friends: [],
      password: hashedPassword,
    });
    res.status(200).json({ message: 'Signup successful' });

  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during signup' });
  }
});

router.post('/login', validateLoginInput, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    // Check if the user exists
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        { error: "Invalid username or password" }
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        { error: "Invalid username or password" });
    }

    // Create a session`
    req.session.userId = user._id;
    req.session.username = user.username;
    await redisClient.set(`user: ${user.username}: status`, 'online', {
      EX: 600, // Expiration in seconds
    });
    res.status(200).json(
      { message: 'Login successful', username: user.username });


  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during login' });
  }
});
router.post('/add_friend', isAuthenticated, async (req, res) => {
  const { username } = req.body;
  try {
    if (!username) {
      console.error(fr);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Friend username is required"
      });
    }

    const currentUser = await User.findOne({ username: req.session.username });
    if (!currentUser) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "User not found"
      });
    }

    // Find potential friend
    const friendUser = await User.findOne({ username: username });
    if (!friendUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: "Cannot find user"
      });
    }

    // Check if users are already friends
    const alreadyFriends = currentUser.friends.some(
      friend => friend.userId.equals(friendUser._id) && friend.status === 'pending'
    );

    if (alreadyFriends) {
      req.session.friendUsername = friendUser.username;
      return res.status(HTTP_STATUS.OK).json({
        message: "Already Friends",
        redirect: '/rooms'
      })
    }

    // Generate unique code
    const uniqueCode = `${req.session.userId.slice(-7)}-${currentUser.username}`;

    // Create email template
    const emailTemplate = createFriendRequestEmailTemplate({
      currentUser: currentUser.username,
      username,
      uniqueCode
    });

    // Send friend request email
    await sendFriendRequestEmail({
      to: friendUser.email,
      template: emailTemplate
    });

    await User.findOneAndUpdate(
      { username: currentUser.username },
      {
        $push: {
          friends: {
            userId: friendUser._id,
            status: 'pending',
            roomCode: uniqueCode
          }
        }
      }
    );

    return res.status(HTTP_STATUS.OK).json({
      message: "Friend request sent successfully"
    });

  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred processing the friend request'
    });
  }
});

// Separate email template creation
function createFriendRequestEmailTemplate({ currentUser, friendUsername, uniqueCode }) {
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
async function sendFriendRequestEmail({ to, template }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
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

router.get('/logout', isAuthenticated, async (req, res) => {
  if (req.session && req.session.userId) {
    await redisClient.set(
      `user: ${req.session.username}: status`, 'online', {
      EX: 15,
    });
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect('/login');
    });
  } else {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      { message: "Not Authenticated" });
  }
});


router.get('/add_friend', isAuthenticated, (req, res) => {
  if (req.session.username) {
    res.render('add_friend', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

router.get('/rooms', isAuthenticated, (req, res) => {
  if (req.session.friendUsername) {
    const friendUsername = req.session.friendUsername;
    const code = req.session.userId.slice(-7);
    const uniqueCode = `${code}-${req.session.username}`;
    const data = { friendUsername, uniqueCode };
    res.render('rooms', data);
  } else {
    res.redirect('/add_friend');
  }
});

export default router;