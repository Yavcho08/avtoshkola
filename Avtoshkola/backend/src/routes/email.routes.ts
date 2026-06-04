import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as email from '../controllers/email.controller';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/recipients', wrap(email.getRecipients));
router.post('/send',      wrap(email.send));

export default router;
