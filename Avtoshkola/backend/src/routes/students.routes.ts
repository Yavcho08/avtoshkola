import { Router } from 'express';
import { authenticate, requireAdmin, requireAdminOrInstructor } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as students from '../controllers/students.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Collection
router.get('/',    requireAdmin,              wrap(students.list));
router.post('/',   requireAdmin,              wrap(students.create));

// Per-student (admin, assigned instructor, or the student themselves — enforced in controller)
router.get('/:id',           requireAdminOrInstructor, wrap(students.getById));
router.patch('/:id',         requireAdmin,             wrap(students.update));
router.get('/:id/progress',  requireAdminOrInstructor, wrap(students.getProgress));
router.get('/:id/exams',     requireAdminOrInstructor, wrap(students.getExams));
router.get('/:id/payments',  requireAdmin,             wrap(students.getPayments));

export default router;
