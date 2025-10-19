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

router.get('/friends', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('friends.userId', 'username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const acceptedFriends = user.friends
      .filter(friend => friend.status === 'accepted')
      .map(friend => ({
        username: friend.userId.username,
        roomCode: friend.roomCode,
      }));

    res.json(acceptedFriends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'An error occurred while fetching friends' });
  }
});

export default router;