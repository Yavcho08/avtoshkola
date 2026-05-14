import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as auth from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/me
router.get('/me', authenticate, wrap(auth.me));

export default router;
