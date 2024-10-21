//routes/users.js

import { dirname, join } from 'path';
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
      sessionId: req.session.userId,
      sessionUsername: req.session.username
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

router.get('/user-status/:userId', async (req, res) => {
  const { userId } = req.params;
  const status = await redisClient.get(`user:${userId}:status`) || 'offline';
  res.json({ status });
});

export default router;
