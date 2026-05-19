import cron from 'node-cron';
import { sendLessonReminders } from '../services/emailReminder.service';

export function startReminderCron(): void {
  // Run every day at 09:00 Sofia time
  cron.schedule(
    '0 9 * * *',
    async () => {
      console.log('[Cron] ▶ Daily lesson reminder job started.');
      try {
        await sendLessonReminders();
      } catch (err) {
        console.error('[Cron] Unhandled error in reminder job:', err);
      }
    },
    { timezone: 'Europe/Sofia' }
  );

  console.log('[Cron] Lesson reminders scheduled — runs daily at 09:00 (Europe/Sofia).');
}
