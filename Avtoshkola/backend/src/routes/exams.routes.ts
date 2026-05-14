import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as exams from '../controllers/exams.controller';

const router = Router();

router.use(authenticate);

// All roles can list exams; controller scopes by role
router.get('/',     wrap(exams.list));
router.post('/',    requireAdmin, wrap(exams.create));
router.patch('/:id', requireAdmin, wrap(exams.update));

export default router;
