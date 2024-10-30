//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput} from "../middleware/validation.js";
import { validateLoginInput } from "../middleware/validation.js";
import { connectToDataBase, getClient, redisClient } from './database.js';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";
import isAuthenticated from "../middleware/auth.js";

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
    res.status(200).json({ message: 'Signup successful' });

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
    await redisClient.set(`user: ${ user.username }: status`, 'online', {
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
    }),
    req.session.destroy();
    res.status(200).json({ message: "Successfully logged out" });
  } else {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      { message: "Not Authenticated" });
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
        { error: "Cannot find friend with the provided username" });
    }
    res.status(HTTP_STATUS.OK).json(
      { message: "Friend added sucessfully", username: user.username });

  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      { error: 'An error occurred during post' });
  }
});

router.get('/add_friend', isAuthenticated, (req, res) => {
  const username = req.query.username;
  res.render('add_friend', { username });
});

router.get('/rooms', isAuthenticated, (req, res) => {
  const friendUsername = req.query.friendUsername;
  const code = req.session.userId.slice(-6);
  const uniqueCode = `${code}-${friendUsername.toString().slice(4)}`;
  const data = { friendUsername, uniqueCode };
  res.render('rooms', data);
});

export default router;