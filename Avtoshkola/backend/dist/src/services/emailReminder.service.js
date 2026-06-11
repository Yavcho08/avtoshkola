"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLessonReminders = sendLessonReminders;
const resend_1 = require("resend");
const supabase_1 = require("../config/supabase");
let _resend = null;
function getResend() {
    if (!_resend)
        _resend = new resend_1.Resend(process.env.RESEND_API_KEY ?? 're_placeholder');
    return _resend;
}
// Use onboarding@resend.dev for test keys.
// For production: set RESEND_FROM_EMAIL to a verified domain address.
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Автошкола <onboarding@resend.dev>';
// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getAuthEmail(profileId) {
    const { data, error } = await supabase_1.supabase.auth.admin.getUserById(profileId);
    if (error || !data.user?.email)
        return null;
    return data.user.email;
}
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('bg-BG', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
}
function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}
// ─── Email template ───────────────────────────────────────────────────────────
function buildHtml(opts) {
    const locationRow = opts.location
        ? `<tr>
         <td style="padding:6px 0;color:#64748b;font-size:14px;width:130px;">📍 Място:</td>
         <td style="padding:6px 0;font-weight:600;font-size:14px;">${opts.location}</td>
       </tr>`
        : '';
    return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#1e40af;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:28px;">🚗</p>
          <h1 style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:700;">Автошкола</h1>
          <p style="margin:0;color:#93c5fd;font-size:13px;">Информационна система</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:17px;">Напомняне за утрешен урок</h2>
          <p style="margin:0 0 20px;color:#475569;font-size:15px;">
            Здравейте, <strong>${opts.recipientFirstName}</strong>! Имате насрочен урок утре.
          </p>

          <!-- Details card -->
          <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;width:130px;">📅 Дата:</td>
              <td style="padding:6px 0;font-weight:600;font-size:14px;">${opts.date}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">🕐 Час:</td>
              <td style="padding:6px 0;font-weight:600;font-size:14px;">${opts.timeRange}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">📖 Тип:</td>
              <td style="padding:6px 0;font-weight:600;font-size:14px;">${opts.lessonType}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">${opts.otherRole}:</td>
              <td style="padding:6px 0;font-weight:600;font-size:14px;">${opts.otherName}</td>
            </tr>
            ${locationRow}
          </table>

          <p style="margin:20px 0 0;color:#475569;font-size:14px;">
            Моля, бъдете навреме. До скоро! 🙂
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            Автошкола — автоматично съобщение, моля не отговаряйте.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
// ─── Main export ──────────────────────────────────────────────────────────────
async function sendLessonReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    console.log(`[Reminder] Fetching scheduled lessons for ${tomorrow.toISOString().split('T')[0]}…`);
    const { data: lessons, error } = await supabase_1.supabase
        .from('lessons')
        .select('*, students(id, profile_id, profiles(*)), instructors(id, profile_id, profiles(*))')
        .gte('start_time', tomorrow.toISOString())
        .lt('start_time', dayAfter.toISOString())
        .eq('status', 'scheduled');
    if (error) {
        console.error('[Reminder] Supabase query failed:', error.message);
        return;
    }
    if (!lessons?.length) {
        console.log('[Reminder] No scheduled lessons for tomorrow.');
        return;
    }
    console.log(`[Reminder] ${lessons.length} lesson(s) found. Sending emails…`);
    let sent = 0;
    for (const lesson of lessons) {
        const studentRec = lesson.students;
        const instructorRec = lesson.instructors;
        if (!studentRec?.profiles || !instructorRec?.profiles) {
            console.warn(`[Reminder] Skipping lesson ${lesson.id} — missing profile data.`);
            continue;
        }
        const studentName = `${studentRec.profiles.first_name} ${studentRec.profiles.last_name}`;
        const instructorName = `${instructorRec.profiles.first_name} ${instructorRec.profiles.last_name}`;
        const date = fmtDate(lesson.start_time);
        const timeRange = `${fmtTime(lesson.start_time)} – ${fmtTime(lesson.end_time)}`;
        const lessonType = lesson.type === 'theory' ? 'Теория' : 'Практика';
        const location = lesson.location ?? null;
        // Fetch auth emails in parallel
        const [studentEmail, instructorEmail] = await Promise.all([
            getAuthEmail(studentRec.profile_id),
            getAuthEmail(instructorRec.profile_id),
        ]);
        // ── Email to student ──
        if (studentEmail) {
            try {
                await getResend().emails.send({
                    from: FROM,
                    to: studentEmail,
                    subject: `Напомняне: Урок утре в ${fmtTime(lesson.start_time)} с ${instructorName}`,
                    html: buildHtml({
                        recipientFirstName: studentRec.profiles.first_name,
                        otherName: instructorName,
                        otherRole: 'Инструктор',
                        date, timeRange, lessonType, location,
                    }),
                });
                sent++;
                console.log(`[Reminder] ✓ Student → ${studentEmail}`);
            }
            catch (err) {
                console.error(`[Reminder] ✗ Student → ${studentEmail}:`, err.message);
            }
        }
        // ── Email to instructor ──
        if (instructorEmail) {
            try {
                await getResend().emails.send({
                    from: FROM,
                    to: instructorEmail,
                    subject: `Напомняне: Урок с ${studentName} утре в ${fmtTime(lesson.start_time)}`,
                    html: buildHtml({
                        recipientFirstName: instructorRec.profiles.first_name,
                        otherName: studentName,
                        otherRole: 'Курсист',
                        date, timeRange, lessonType, location,
                    }),
                });
                sent++;
                console.log(`[Reminder] ✓ Instructor → ${instructorEmail}`);
            }
            catch (err) {
                console.error(`[Reminder] ✗ Instructor → ${instructorEmail}:`, err.message);
            }
        }
    }
    console.log(`[Reminder] Done — ${sent} email(s) sent.`);
}
//# sourceMappingURL=emailReminder.service.js.map