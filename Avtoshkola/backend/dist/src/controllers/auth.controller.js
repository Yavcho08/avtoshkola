"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.me = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/auth/me
// Returns the authenticated user's profile (already hydrated by authMiddleware).
const me = async (req, res) => {
    (0, response_1.sendSuccess)(res, req.user);
};
exports.me = me;
// POST /api/auth/register
// Creates a new Supabase auth user + profile row. Role is always 'student' for self-registration.
const register = async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name) {
        (0, response_1.sendError)(res, 'Полетата имейл, парола, собствено и фамилно име са задължителни.', 400);
        return;
    }
    if (password.length < 6) {
        (0, response_1.sendError)(res, 'Паролата трябва да е поне 6 символа.', 400);
        return;
    }
    // Phone uniqueness check — one phone number per profile
    if (phone?.trim()) {
        const { data: existingPhone } = await supabase_1.supabase
            .from('profiles')
            .select('id')
            .eq('phone', phone.trim())
            .maybeSingle();
        if (existingPhone) {
            (0, response_1.sendError)(res, 'Този телефонен номер вече е регистриран в системата.', 409);
            return;
        }
    }
    const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (authError || !authData.user) {
        const msg = authError?.message ?? 'Неуспешна регистрация.';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
            (0, response_1.sendError)(res, 'Имейл адресът вече е регистриран.', 409);
        }
        else {
            (0, response_1.sendError)(res, msg, 400);
        }
        return;
    }
    // Use upsert so a pre-existing row (created by a DB trigger) is updated
    // instead of throwing a unique-constraint violation.
    const { error: profileError } = await supabase_1.supabase.from('profiles').upsert({
        id: authData.user.id,
        role: 'student',
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone?.trim() || null,
    }, { onConflict: 'id' });
    if (profileError) {
        console.error('[register] profile upsert failed:', profileError);
        await supabase_1.supabase.auth.admin.deleteUser(authData.user.id);
        (0, response_1.sendError)(res, `Грешка при създаване на профил: ${profileError.message}`, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, { message: 'Регистрацията е успешна. Можете да влезете в системата.' }, 201);
};
exports.register = register;
//# sourceMappingURL=auth.controller.js.map