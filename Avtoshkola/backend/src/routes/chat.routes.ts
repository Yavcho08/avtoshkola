import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as chat from '../controllers/chat.controller';

const router = Router();

router.use(authenticate);

router.get('/contacts',          wrap(chat.getContacts));
router.get('/messages/:profileId', wrap(chat.getMessages));
router.post('/send',             wrap(chat.sendMessage));
router.patch('/read/:profileId', wrap(chat.markRead));
router.get('/unread',            wrap(chat.unreadCount));

export default router;
