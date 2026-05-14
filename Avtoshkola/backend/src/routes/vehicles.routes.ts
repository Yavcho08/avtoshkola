import { Router } from 'express';
import {
  authenticate,
  requireAdmin,
  requireAdminOrInstructor,
} from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as vehicles from '../controllers/vehicles.controller';

const router = Router();

router.use(authenticate);

// /expiring must come before /:id so Express doesn't treat "expiring" as an id param
router.get('/expiring', requireAdmin, wrap(vehicles.getExpiring));

router.get('/',     requireAdminOrInstructor, wrap(vehicles.list));
router.post('/',    requireAdmin,             wrap(vehicles.create));
router.get('/:id',  requireAdminOrInstructor, wrap(vehicles.getById));
router.patch('/:id', requireAdmin,            wrap(vehicles.update));

export default router;
