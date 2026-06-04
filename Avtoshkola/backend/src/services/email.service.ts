import { Resend } from 'resend';
import { supabase } from '../config/supabase';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Avtoshkola <onboarding@resend.dev>';

async function getEmail(profileId: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(profileId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString('bg-BG', { dateStyle: 'long', timeStyle: 'short' });
}

function layout(title: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;border-radius:8px;overflow:hidden;border:1px solid #d1d9e0;">

        <!-- Header -->
        <tr><td style="background:${accentColor};padding:28px 36px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:0.5px;">АВТОШКОЛА</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${title}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 36px 28px;">${body}</td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f7fa;padding:18px 36px;border-top:2px solid #e2e8f0;">
          <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;">Автошкола — Информационна система</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">Това е автоматично съобщение. Моля, не отговаряйте на него.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:9px 14px;font-size:13px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;width:140px;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:9px 14px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function detailsCard(rows: string) {
  return `<table width="100%" style="border:2px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin:20px 0;overflow:hidden;">
    <thead><tr><td colspan="2" style="background:#f9fafb;padding:10px 14px;font-size:11px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;">Детайли за занятието</td></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function greeting(firstName: string) {
  return `<p style="margin:0 0 6px;font-size:16px;font-weight:900;color:#111827;">Уважаем/а ${firstName},</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:2px solid #e5e7eb;margin:24px 0;">`;
}

// ── Lesson created ────────────────────────────────────────────────────────────
export async function sendLessonCreatedEmails(lesson: {
  student_id: string; instructor_id: string;
  type: string; start_time: string; end_time: string;
  students?: any; instructors?: any; vehicles?: any;
}): Promise<void> {
  const typeLabel = lesson.type === 'theory' ? 'Теория' : 'Практика';
  const dt = fmtDT(lesson.start_time);
  const studentName = `${lesson.students?.profiles?.first_name ?? ''} ${lesson.students?.profiles?.last_name ?? ''}`.trim();
  const instructorName = `${lesson.instructors?.profiles?.first_name ?? ''} ${lesson.instructors?.profiles?.last_name ?? ''}`.trim();
  const vehicle = lesson.vehicles?.registration_number ?? null;

  const rows = [
    detailRow('Тип', typeLabel),
    detailRow('Дата и час', dt),
    detailRow('Инструктор', instructorName),
    ...(vehicle ? [detailRow('МПС', vehicle)] : []),
  ].join('');

  const instructorRows = [
    detailRow('Тип', typeLabel),
    detailRow('Дата и час', dt),
    detailRow('Курсист', studentName),
    ...(vehicle ? [detailRow('МПС', vehicle)] : []),
  ].join('');

  const [studentEmail, instructorEmail] = await Promise.all([
    getEmail(lesson.students?.profile_id ?? lesson.student_id),
    getEmail(lesson.instructors?.profile_id ?? lesson.instructor_id),
  ]);

  const sends: Promise<any>[] = [];

  if (studentEmail) {
    sends.push(getResend().emails.send({
      from: FROM,
      to: studentEmail,
      subject: `Насрочено ново занятие - ${dt}`,
      html: layout('Насрочено занятие', '#1d4ed8',
        `${greeting(lesson.students?.profiles?.first_name ?? '')}
         <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">
           Уведомяваме Ви, че Ви е насрочено ново занятие по управление на МПС.
         </p>
         ${detailsCard(rows)}
         ${divider()}
         <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280;">
           Моля, явете се навреме на определеното място. При невъзможност за явяване, уведомете инструктора предварително.
         </p>`
      ),
    }).catch(() => {}));
  }

  if (instructorEmail) {
    sends.push(getResend().emails.send({
      from: FROM,
      to: instructorEmail,
      subject: `Насрочено занятие - ${studentName} в ${dt}`,
      html: layout('Насрочено занятие', '#1d4ed8',
        `${greeting(lesson.instructors?.profiles?.first_name ?? '')}
         <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">
           Информираме Ви, че Ви е насрочено ново занятие с курсист.
         </p>
         ${detailsCard(instructorRows)}`
      ),
    }).catch(() => {}));
  }

  await Promise.allSettled(sends);
}

// ── Lesson cancelled ──────────────────────────────────────────────────────────
export async function sendLessonCancelledEmails(lesson: {
  type: string; start_time: string;
  students?: any; instructors?: any;
}): Promise<void> {
  const typeLabel = lesson.type === 'theory' ? 'Теория' : 'Практика';
  const dt = fmtDT(lesson.start_time);
  const studentName = `${lesson.students?.profiles?.first_name ?? ''} ${lesson.students?.profiles?.last_name ?? ''}`.trim();

  const rows = detailsCard([
    detailRow('Тип', typeLabel),
    detailRow('Насрочено за', dt),
  ].join(''));

  const [studentEmail, instructorEmail] = await Promise.all([
    getEmail(lesson.students?.profile_id),
    getEmail(lesson.instructors?.profile_id),
  ]);

  const sends: Promise<any>[] = [];

  if (studentEmail) {
    sends.push(getResend().emails.send({
      from: FROM,
      to: studentEmail,
      subject: `Отказано занятие - ${dt}`,
      html: layout('Отказано занятие', '#b91c1c',
        `${greeting(lesson.students?.profiles?.first_name ?? '')}
         <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">
           Уведомяваме Ви, че занятието Ви е отказано.
         </p>
         ${rows}
         ${divider()}
         <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280;">
           За насрочване на нов час, моля свържете се с Вашия инструктор.
         </p>`
      ),
    }).catch(() => {}));
  }

  if (instructorEmail) {
    sends.push(getResend().emails.send({
      from: FROM,
      to: instructorEmail,
      subject: `Отказано занятие - ${studentName}`,
      html: layout('Отказано занятие', '#b91c1c',
        `${greeting(lesson.instructors?.profiles?.first_name ?? '')}
         <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">
           Занятието с курсист ${studentName} е отказано.
         </p>
         ${rows}`
      ),
    }).catch(() => {}));
  }

  await Promise.allSettled(sends);
}

// ── Lesson completed ──────────────────────────────────────────────────────────
export async function sendLessonCompletedEmail(lesson: {
  type: string; start_time: string; grade?: number | null; instructor_notes?: string | null;
  students?: any;
}): Promise<void> {
  const email = await getEmail(lesson.students?.profile_id);
  if (!email) return;

  const typeLabel = lesson.type === 'theory' ? 'Теория' : 'Практика';

  const rows = [
    detailRow('Тип', typeLabel),
    detailRow('Дата', fmtDT(lesson.start_time)),
    ...(lesson.grade != null ? [detailRow('Оценка', String(lesson.grade))] : []),
  ].join('');

  const notesBlock = lesson.instructor_notes
    ? `${divider()}
       <p style="margin:0 0 8px;font-size:11px;font-weight:900;color:#374151;text-transform:uppercase;letter-spacing:1px;">Бележки от инструктора</p>
       <p style="margin:0;font-size:14px;font-weight:600;color:#1f2937;line-height:1.6;padding:14px 16px;background:#f9fafb;border-left:4px solid #16a34a;border-radius:0 6px 6px 0;">${lesson.instructor_notes}</p>`
    : '';

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Завършено занятие${lesson.grade != null ? ` - Оценка ${lesson.grade}` : ''}`,
    html: layout('Завършено занятие', '#15803d',
      `${greeting(lesson.students?.profiles?.first_name ?? '')}
       <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">
         Занятието Ви е приключено успешно. По-долу ще намерите информация за резултата.
       </p>
       ${detailsCard(rows)}${notesBlock}`
    ),
  }).catch(() => {});
}
