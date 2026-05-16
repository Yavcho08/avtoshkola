import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as auth from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/me
router.get('/me', authenticate, wrap(auth.me));

// POST /api/auth/register
router.post('/register', wrap(auth.register));

export default router;
