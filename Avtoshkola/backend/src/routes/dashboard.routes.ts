import { Router } from 'express';
import {
  authenticate,
  requireAdmin,
  requireInstructor,
  requireStudent,
} from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as dashboard from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/admin',      requireAdmin,      wrap(dashboard.adminStats));
router.get('/instructor', requireInstructor, wrap(dashboard.instructorStats));
router.get('/student',    requireStudent,    wrap(dashboard.studentStats));

export default router;
