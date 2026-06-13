import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без объркващи I, O, 0, 1

function randomCode(): string {
  let c = '';
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

// Връща (или генерира при липса) уникален реферален код за даден профил.
async function ensureCode(profileId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', profileId)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  // Генерирай уникален код (с няколко опита при колизия)
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const { error } = await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', profileId);
    if (!error) return code;
  }
  return null;
}

// GET /api/referrals/me — кодът на курсиста + поканените от него
export const getMine = async (req: Request, res: Response): Promise<void> => {
  const profileId = req.user!.id;

  const code = await ensureCode(profileId);
  if (!code) { sendError(res, 'Грешка при генериране на код.', 500); return; }

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('id, referred_name, created_at')
    .eq('referrer_id', profileId)
    .order('created_at', { ascending: false });

  if (error) { sendError(res, error.message, 500); return; }

  sendSuccess(res, {
    code,
    count: referrals?.length ?? 0,
    referrals: referrals ?? [],
  });
};

// Извиква се от auth.register когато новият курсист е въвел реферален код.
// Свързва поканилия с поканения. Не хвърля грешка навън — реферирането е по избор.
export async function recordReferral(code: string, referredId: string, referredName: string): Promise<void> {
  try {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', clean)
      .maybeSingle();

    // Невалиден код или опит за самопрепоръчване — игнорирай
    if (!referrer || referrer.id === referredId) return;

    await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: referredId,
      referred_name: referredName,
    });
  } catch {
    /* реферирането е по избор — не блокираме регистрацията */
  }
}
