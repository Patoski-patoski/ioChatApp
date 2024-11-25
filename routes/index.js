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
import {updateOne, checkFriendStatus } from '../public/javascripts/utils.js';
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
      error: "Friend username is required"
    });
  }
  if (username === req.session.username) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "You cannot chat with yourself!"
    });
  }

  try {

    const currentUser = await User.findOne({ username: req.session.username });
    const friendUser = await User.findOne({ username: username });

    if (!currentUser || !friendUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: "User not found",
      });
    }

    const { isPending, isPending_2, isAccepted } = await checkFriendStatus(currentUser, friendUser);

    if (isPending || isPending_2 ||isAccepted) {
      req.session.friendUsername = friendUser.username;
      return res.status(HTTP_STATUS.OK).json({
        message: 'Already friends',
        redirect: '/rooms',
        username: req.session.username
      });
    }

    // Generate unique code
    const uniqueCode = generateRoomCode(currentUser._id.toString(), currentUser.username);
    // Update friends status
    await updateOne(currentUser, friendUser, uniqueCode);

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

    req.session.friendUsername = friendUser.username;
    
    return res.status(HTTP_STATUS.OK).json({
      message: "Friend request sent successfully",
      redirect: '/rooms',
      username: req.session.username
    });

  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'An error occurred processing the friend request'
    });
  }
});

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
    const uniqueCode = generateRoomCode(req.session.userId.toString(), req.session.username);
    const data = { friendUsername, uniqueCode };
    res.render('rooms', data);
  } else {
    res.redirect('/add_friend');
  }
});

export default router;