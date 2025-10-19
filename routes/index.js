//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput } from "../middleware/validation.js";
import { validateLoginInput } from "../middleware/validation.js";
import { redisClient } from './database.js';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";
import isAuthenticated from "../middleware/auth.js";
import { User } from '../models/Users.js';
import {updateOne } from '../public/javascripts/utils.js';
import { generateRoomCode, } from '../public/javascripts/utils.js';
import { sendFriendRequestEmail } from '../public/javascripts/utils.js';
import { createFriendRequestEmailTemplate } from '../public/javascripts/utils.js';

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

    const existingUsername = await User.findOne({ username });
    const existingUserByEmail = await User.findOne({ email });
    
    if (existingUsername || existingUserByEmail) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        { error: 'User already exists. Please choose another.' });
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
      { message: 'Login successful', username: req.session.username });

  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during login' });
  }
});


router.post('/add_friend', isAuthenticated, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "Friend username is required",
    });
  }


  if (username.toLowerCase().trim() === req.session.username.toLowerCase().trim()) {
    console.log('Reached here!!!');
      console.log('username', username.toLowerCase().trim());
  console.log('session', req.session.username.toLowerCase().trim());
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "You cannot add yourself as a friend!"
    });
  }

  try {
    const [currentUser, friendUser] = await Promise.all([
      await User.findOne({ username: req.session.username }),
      await User.findOne({ username: username.toLowerCase().trim() })
    ]);

    if (!friendUser || !currentUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: "User not found",
      });
    }

   // Check existing friend status
    const currentFriendship = currentUser.friends.find((f) =>
      f.userId.equals(friendUser._id)
    );
    const friendFriendship = friendUser.friends.find((f) =>
      f.userId.equals(currentUser._id)
    );

    if (currentFriendship?.status === "accepted") {
      req.session.friendUsername = friendUser.username;
      req.session.uniqueCode = currentFriendship.roomCode; // Ensure correct roomCode is stored
      return res.status(HTTP_STATUS.OK).json({
        message: "You are already friends",
        redirect: "/rooms",
      });
    }

    if (currentFriendship?.status === "pending" || friendFriendship?.status === "pending") {
      req.session.friendUsername = friendUser.username;
      req.session.uniqueCode = currentFriendship?.roomCode || friendFriendship?.roomCode;
      return res.status(HTTP_STATUS.OK).json({
        message: "Friend request already exists",
        redirect: "/rooms",
      });
    }

    // Generate unique code
    const uniqueCode = generateRoomCode(
      currentUser._id.toString(), currentUser.username);
    
    // Update friends status
    await updateOne(currentUser, friendUser, uniqueCode);

    // Create email template
    const emailTemplate = createFriendRequestEmailTemplate({
      currentUser: currentUser.username,
      friendUsername: friendUser.username,
      uniqueCode,
    });

    // Send email notification
    await sendFriendRequestEmail(
      { to: friendUser.email, template: emailTemplate });

    // Emit a friend request event to the friend user
    req.io.emit('friendRequest', {
      from: currentUser.username,
      to: friendUser.username,
    });

    req.session.friendUsername = friendUser.username;
    req.session.uniqueCode = uniqueCode;
    
    return res.status(HTTP_STATUS.OK).json({
      message: "Friend request sent successfully",
      redirect: '/rooms',
    });

  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while adding the friend'
    });
  }
});


router.get('/rooms', isAuthenticated, async (req, res) => {
  try {
    res.render('rooms', { username: req.session.username });
  } catch (error) {
    console.error('Rooms route error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred while loading the chat room'
    });
  }
});

router.get('/logout', async (req, res) => {
  try {
    if (req.session && req.session.userId) {
      await redisClient.set(
        `user: ${req.session.username}: status`, 'offline', {
        EX: 15,
      });
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroyingg session:', err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict', // Prevent CSRF
        });
        res.redirect('/login');
      });
    } else {
      // If no active session
      res.redirect('/login');
    }

  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred trying to logout'
    });
  }
});

router.get('/add_friend', isAuthenticated, (req, res) => {
  if (req.session.username) {
    res.render('add_friend', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});


export default router;