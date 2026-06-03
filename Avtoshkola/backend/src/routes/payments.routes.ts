import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { wrap } from '../utils/response';
import * as payments from '../controllers/payments.controller';

const router = Router();

router.use(authenticate);

// /summary and Stripe endpoints must come before /:id
router.get('/summary',                  requireAdmin, wrap(payments.getSummary));
router.post('/create-checkout-session',              wrap(payments.createCheckoutSession));
router.post('/confirm-payment',                      wrap(payments.confirmPayment));

// Students can list their own payments; controller enforces scope
router.get('/',      wrap(payments.list));
router.post('/',     requireAdmin, wrap(payments.create));
router.patch('/:id', requireAdmin, wrap(payments.update));

export default router;
