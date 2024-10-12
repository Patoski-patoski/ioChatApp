//routes/index.js
import { join } from 'path';
import bcrypt from "bcrypt";
import { Router } from 'express';
import { validateSignupInput, validateLoginInput } from "../middleware/validation.js";
import { connectToDataBase, getClient } from './database.js';
import { HTTP_STATUS, SALT_ROUNDS } from "../public/javascripts/constants.js";

const router = Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
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

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        { error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        { error: "Invalid username or password" });
    }

    // Create a session
    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ success: true, message: 'Login successful', username: user.username });

  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred during login' });
  }

});


router.get('/private_chat', (res, req) => {

});

router.get('/signup', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'signup.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'login.html'));
});

export default router;
