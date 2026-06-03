import { Router, Request, Response } from 'express';
import { sendLessonReminders } from '../services/emailReminder.service';

const router = Router();

// This endpoint is meant to be hit by Vercel Cron.
router.get('/reminders', async (req: Request, res: Response): Promise<void> => {
  // Optional: Check an Authorization header against a CRON_SECRET to protect this route.
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   res.status(401).json({ error: 'Unauthorized' });
  //   return;
  // }

  try {
    console.log('[Cron API] ▶ Lesson reminder job started via API.');
    await sendLessonReminders();
    res.json({ success: true, message: 'Reminders sent successfully' });
  } catch (error: any) {
    console.error('[Cron API] Error sending reminders:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

export default router;
