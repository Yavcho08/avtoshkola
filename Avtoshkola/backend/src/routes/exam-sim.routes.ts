import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { examSim } from '../controllers/exam-sim.controller';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(authenticate);
router.get('/generate', wrap(examSim.generate));
router.post('/submit', wrap(examSim.submit));
router.get('/history', wrap(examSim.getHistory));

export default router;
