//routes/users.js

import { join } from 'path';
import { Router } from 'express';
import { redisClient } from './database.js';
import isAuthenticated from "../middleware/auth.js";

const router = Router();

/* GET users listing. */
router.get('/', isAuthenticated, (req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'login.html'));
});

// API route to check authentication status
router.get('/auth-status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      isAuthenticated: true,
      sessionID: req.sessionID,
      userId: req.session.userId,
      sessionUsername: req.session.username
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

router.get('/user-status/:userName', async (req, res) => {
  const username = req.session.username;
  const status = await redisClient.get(`user: ${username}: status`) || 'offline';
  res.json({ status: status });
});

export default router;