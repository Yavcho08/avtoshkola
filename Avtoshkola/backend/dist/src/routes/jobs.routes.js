"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailReminder_service_1 = require("../services/emailReminder.service");
const router = (0, express_1.Router)();
// This endpoint is meant to be hit by Vercel Cron.
router.get('/reminders', async (req, res) => {
    // Optional: Check an Authorization header against a CRON_SECRET to protect this route.
    // const authHeader = req.headers.authorization;
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   res.status(401).json({ error: 'Unauthorized' });
    //   return;
    // }
    try {
        console.log('[Cron API] ▶ Lesson reminder job started via API.');
        await (0, emailReminder_service_1.sendLessonReminders)();
        res.json({ success: true, message: 'Reminders sent successfully' });
    }
    catch (error) {
        console.error('[Cron API] Error sending reminders:', error);
        res.status(500).json({ error: 'Failed to send reminders' });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.routes.js.map