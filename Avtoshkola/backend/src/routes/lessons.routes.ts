import { Router } from 'express';
import {
  authenticate,
  requireAdminOrInstructor,
} from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as lessons from '../controllers/lessons.controller';

const router = Router();

router.use(authenticate);

// Students can list their own lessons and book new ones; admins and instructors manage all
router.get('/',       wrap(lessons.list));
router.post('/',      wrap(lessons.create));          // controller enforces role scope
router.patch('/:id',  requireAdminOrInstructor, wrap(lessons.update));
router.delete('/:id', requireAdminOrInstructor, wrap(lessons.cancel));

export default router;
