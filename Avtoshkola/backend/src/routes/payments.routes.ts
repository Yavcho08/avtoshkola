import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as payments from '../controllers/payments.controller';

const router = Router();

router.use(authenticate);

// /summary before /:id
router.get('/summary', requireAdmin, wrap(payments.getSummary));

// Students can list their own payments; controller enforces scope
router.get('/',      wrap(payments.list));
router.post('/',     requireAdmin, wrap(payments.create));
router.patch('/:id', requireAdmin, wrap(payments.update));

export default router;
