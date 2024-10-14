import { dirname, join } from 'path';
import { Router } from 'express';
const router = Router();


/* GET users listing. */
router.get('/p', (req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'home.html'));
});

router.get('/user-status/:userId', async (req, res) => {
  const { userId } = req.params;
  const status = await redisClient.get(`user:${userId}:status`) || 'offline';
  res.json({ status });
});

export default router;
