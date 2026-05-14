import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as expenses from '../controllers/expenses.controller';

const router = Router();

router.use(authenticate);

// All expense routes are admin-only
router.get('/summary', requireAdmin, wrap(expenses.getSummary));
router.get('/',        requireAdmin, wrap(expenses.list));
router.post('/',       requireAdmin, wrap(expenses.create));
router.patch('/:id',   requireAdmin, wrap(expenses.update));
router.delete('/:id',  requireAdmin, wrap(expenses.remove));

export default router;
