//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput, validateLoginInput } from "../middleware/validation.js";
import { connectToDataBase, getClient, redisClient } from './database.js';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";
import isAuthenticated from "../middleware/auth.js";
import { v4 as uuid4 } from 'uuid';
import { render } from 'jade';

const router = Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
});
router.get('/signup', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'signup.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'login.html'));
});

router.post('/signup', validateSignupInput, async (req, res, next) => {
  const { username, sex, password } = req.body;
  try {
    await connectToDataBase();
    const client = getClient();
    const db = client.db("chatapp");
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        { error: 'Username already exists. Please choose another.' });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await usersCollection.insertOne({
      username,
      sex,
      password: hashedPassword,
    });
    res.redirect(301, '/login.html');
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during signup' });
  }
});

router.post('/login', validateLoginInput, async (req, res) => {
  const { username, password } = req.body;
  try {
    await connectToDataBase();
    const client = getClient();
    const db = client.db("chatapp");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!user || !isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        { error: "Invalid username or password" });
    }
    // Create a session
    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ message: 'Login successful', username: user.username });

  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during login' });
  }
});

router.get('/logout', isAuthenticated, async (req, res) => {
  if (req.session && req.session.userId) {
    req.session.destroy();
    res.status(HTTP_STATUS.OK).sendFile(
        join(process.cwd(), 'public', 'index.html'));

  } else {
    res.json({ message: "Not Authenticated" });
  }
});

router.post('/add_friend', isAuthenticated, async (req, res) => {
  const { username } = req.body;
  try {
    await connectToDataBase();
    const client = getClient();
    const db = client.db("chatapp");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        { error: "Cannot find friend with username" });
    }
    res.status(HTTP_STATUS.OK).json({ message: "Friend found", username: user.username });

  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during post' });
  }
});

router.get('/add_friend', isAuthenticated, (req, res) => {
  const username = req.query.username;
  // res.sendFile(join(process.cwd()), 'public', 'add_friend.html');
  res.render('add_friend', {username});

});

router.get('/rooms', isAuthenticated, (req, res) => {
  const friendUsername = req.query.friendUsername;
  const uniqueCode = req.sessionID.substring(0, 7);
  const data = { friendUsername, uniqueCode };
  res.render('rooms', data);
});

// API route to check authentication status
router.get('/api/auth-status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      isAuthenticated: true,
      sessionID: req.sessionID,
      sessionId: req.session.userId,
      sessionUsername: req.session.username
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

export default router;