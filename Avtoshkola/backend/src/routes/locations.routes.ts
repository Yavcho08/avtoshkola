import { Router } from 'express';
import { authenticate, requireAdminOrInstructor } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import { list, create, remove } from '../controllers/locations.controller';

const router = Router();

router.use(authenticate);
router.get('/', wrap(list));
router.post('/', requireAdminOrInstructor, wrap(create));
router.delete('/:id', requireAdminOrInstructor, wrap(remove));

export default router;
