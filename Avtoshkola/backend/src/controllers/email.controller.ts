import { Request, Response } from 'express';
import { Resend } from 'resend';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Avtoshkola <onboarding@resend.dev>';

function buildHtml(subject: string, body: string): string {
  const escaped = body.replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html lang="bg"><head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;border-radius:8px;overflow:hidden;border:1px solid #d1d9e0;">
        <tr><td style="background:#1d4ed8;padding:28px 36px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:0.5px;">АВТОШКОЛА</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${subject}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#1f2937;line-height:1.8;">${escaped}</p>
        </td></tr>
        <tr><td style="background:#f5f7fa;padding:18px 36px;border-top:2px solid #e2e8f0;">
          <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;">Автошкола — Информационна система</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">Това е официално съобщение от автошколата.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// GET /api/emails/recipients — lists all students + instructors with emails
export const getRecipients = async (_req: Request, res: Response): Promise<void> => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .in('role', ['student', 'instructor'])
    .order('first_name');

  if (!profiles) { sendSuccess(res, []); return; }

  const withEmails = await Promise.all(
    profiles.map(async (p) => {
      const { data } = await supabase.auth.admin.getUserById(p.id);
      return { ...p, email: data?.user?.email ?? null };
    })
  );

  sendSuccess(res, withEmails.filter(p => p.email));
};

// POST /api/emails/send
export const send = async (req: Request, res: Response): Promise<void> => {
  const { to, subject, body } = req.body as {
    to: string[];       // array of email addresses
    subject?: string;
    body?: string;
  };

  if (!to?.length || !subject?.trim() || !body?.trim()) {
    sendError(res, 'to, subject и body са задължителни.', 422); return;
  }
  if (to.length > 100) {
    sendError(res, 'Максимум 100 получателя наведнъж.', 422); return;
  }

  const BATCH = 10;
  let sent = 0;
  let lastError = '';
  const html = buildHtml(subject.trim(), body.trim());

  for (let i = 0; i < to.length; i += BATCH) {
    const chunk = to.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      chunk.map(email =>
        getResend().emails.send({ from: FROM, to: email, subject: subject.trim(), html })
      )
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.error) {
          lastError = (r.value.error as any).message ?? 'Unknown error';
        } else {
          sent++;
        }
      } else {
        lastError = r.reason?.message ?? 'Unknown error';
      }
    }
  }

  if (sent === 0 && lastError) {
    if (lastError.includes('verify a domain') || lastError.includes('own email address')) {
      sendError(res,
        'Resend изисква верифициран домейн за изпращане до външни адреси. ' +
        'Отиди на resend.com/domains, добави домейн и го верифицирай, ' +
        'след което добави RESEND_FROM_EMAIL в Vercel environment variables.',
        403);
      return;
    }
    sendError(res, lastError, 500);
    return;
  }

  sendSuccess(res, { sent, total: to.length, skipped: to.length - sent });
};
