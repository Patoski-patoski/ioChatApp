//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput } from "../middleware/validation.js";
import { validateLoginInput } from "../middleware/validation.js";
import { connectToDataBase, redisClient } from './database.js';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";
import isAuthenticated from "../middleware/auth.js";
import { User, Message } from '../models/users.js';

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

    console.log(existingUser);
    
    res.status(200).json({ message: 'Signup successful' });

  } catch (error) {
    console.error('Signup error:', error);
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
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during login' });
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
    const code = req.session.userId.slice(-7);
    const uniqueCode = `${code}-${req.session.friendUsername}`;
    const data = { friendUsername, uniqueCode };
    res.render('rooms', data);
  } else {
    res.redirect('/add_friend');
  }
});

export default router;