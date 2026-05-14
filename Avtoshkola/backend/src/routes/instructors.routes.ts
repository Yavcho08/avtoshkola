import { Router } from 'express';
import { authenticate, requireAdmin, requireAdminOrInstructor } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as instructors from '../controllers/instructors.controller';

const router = Router();

router.use(authenticate);

router.get('/',   requireAdmin,              wrap(instructors.list));
router.post('/',  requireAdmin,              wrap(instructors.create));

// Self-access enforced in controller for instructor role
router.get('/:id',           requireAdminOrInstructor, wrap(instructors.getById));
router.patch('/:id',         requireAdmin,             wrap(instructors.update));
router.get('/:id/schedule',  requireAdminOrInstructor, wrap(instructors.getSchedule));

export default router;
