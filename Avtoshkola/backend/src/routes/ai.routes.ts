import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { ai } from '../controllers/ai.controller';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(authenticate);
router.post('/ask', wrap(ai.ask));
router.get('/history', wrap(ai.getHistory));

export default router;
