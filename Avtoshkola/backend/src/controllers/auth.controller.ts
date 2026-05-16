import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/auth/me
// Returns the authenticated user's profile (already hydrated by authMiddleware).
export const me = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, req.user);
};

// POST /api/auth/register
// Creates a new Supabase auth user + profile row. Role is always 'student' for self-registration.
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, phone } = req.body as {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };

  if (!email || !password || !first_name || !last_name) {
    sendError(res, 'Полетата имейл, парола, собствено и фамилно име са задължителни.', 400);
    return;
  }

  if (password.length < 6) {
    sendError(res, 'Паролата трябва да е поне 6 символа.', 400);
    return;
  }

  // Phone uniqueness check — one phone number per profile
  if (phone?.trim()) {
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone.trim())
      .maybeSingle();

    if (existingPhone) {
      sendError(res, 'Този телефонен номер вече е регистриран в системата.', 409);
      return;
    }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Неуспешна регистрация.';
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
      sendError(res, 'Имейл адресът вече е регистриран.', 409);
    } else {
      sendError(res, msg, 400);
    }
    return;
  }

  // Use upsert so a pre-existing row (created by a DB trigger) is updated
  // instead of throwing a unique-constraint violation.
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    role: 'student',
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    phone: phone?.trim() || null,
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('[register] profile upsert failed:', profileError);
    await supabase.auth.admin.deleteUser(authData.user.id);
    sendError(res, `Грешка при създаване на профил: ${profileError.message}`, 500);
    return;
  }

  sendSuccess(res, { message: 'Регистрацията е успешна. Можете да влезете в системата.' }, 201);
};
