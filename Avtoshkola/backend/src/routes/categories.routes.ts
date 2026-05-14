import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as categories from '../controllers/categories.controller';

const router = Router();

router.use(authenticate);

router.get('/', wrap(categories.list));

export default router;
