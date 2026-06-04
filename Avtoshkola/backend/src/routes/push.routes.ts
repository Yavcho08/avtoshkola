import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as push from '../controllers/push.controller';

const router = Router();

router.get('/vapid-public-key', push.getVapidPublicKey);
router.post('/subscribe',   authenticate, wrap(push.subscribe));
router.delete('/unsubscribe', authenticate, wrap(push.unsubscribe));

export default router;
