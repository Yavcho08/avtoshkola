import { Router } from 'express';
import {
  authenticate,
  requireAdminOrInstructor,
} from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as lessons from '../controllers/lessons.controller';

const router = Router();

router.use(authenticate);

// Students can list their own lessons; admins and instructors can list all / filtered
router.get('/',     wrap(lessons.list));
router.post('/',    requireAdminOrInstructor, wrap(lessons.create));
router.patch('/:id', requireAdminOrInstructor, wrap(lessons.update));
router.delete('/:id', requireAdminOrInstructor, wrap(lessons.cancel));

export default router;
