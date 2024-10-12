import { dirname, join } from 'path';
import { Router } from 'express';
const router = Router();


/* GET users listing. */
router.get('/p', (req, res, next) => {
  res.sendFile(join(process.cwd(), 'public', 'home.html'));
});

export default router;
