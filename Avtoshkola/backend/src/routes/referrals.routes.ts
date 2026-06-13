import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import { getMine } from '../controllers/referrals.controller';

const router = Router();

router.use(authenticate);
router.get('/me', wrap(getMine));

export default router;
