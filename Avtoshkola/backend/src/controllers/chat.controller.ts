import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/chat/contacts
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role === 'student') {
    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (!student) { sendSuccess(res, []); return; }

    const { data: lessons } = await supabase
      .from('lessons')
      .select('instructor_id, instructors(profile_id, profiles(first_name, last_name))')
      .eq('student_id', student.id);

    const seen = new Set<string>();
    const contacts = (lessons ?? [])
      .filter(l => {
        const pid = (l.instructors as any)?.profile_id;
        if (!pid || seen.has(pid)) return false;
        seen.add(pid); return true;
      })
      .map(l => ({
        profile_id: (l.instructors as any)?.profile_id,
        first_name: (l.instructors as any)?.profiles?.first_name,
        last_name: (l.instructors as any)?.profiles?.last_name,
        role: 'instructor',
      }));
    sendSuccess(res, contacts);

  } else if (user.role === 'instructor') {
    const { data: instructor } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();
    if (!instructor) { sendSuccess(res, []); return; }

    const { data: lessons } = await supabase
      .from('lessons')
      .select('student_id, students(profile_id, profiles(first_name, last_name))')
      .eq('instructor_id', instructor.id);

    const seen = new Set<string>();
    const contacts = (lessons ?? [])
      .filter(l => {
        const pid = (l.students as any)?.profile_id;
        if (!pid || seen.has(pid)) return false;
        seen.add(pid); return true;
      })
      .map(l => ({
        profile_id: (l.students as any)?.profile_id,
        first_name: (l.students as any)?.profiles?.first_name,
        last_name: (l.students as any)?.profiles?.last_name,
        role: 'student',
      }));
    sendSuccess(res, contacts);

  } else {
    sendSuccess(res, []);
  }
};

// GET /api/chat/messages/:profileId
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const me = req.user!.id;
  const other = req.params.profileId;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data ?? []);
};

// POST /api/chat/send
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const sender_id = req.user!.id;
  const { receiver_id, content } = req.body as { receiver_id?: string; content?: string };

  if (!receiver_id || !content?.trim()) {
    sendError(res, 'receiver_id и content са задължителни.', 422); return;
  }
  if (content.length > 2000) {
    sendError(res, 'Максимум 2000 символа.', 422); return;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id, receiver_id, content: content.trim() })
    .select('*').single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/chat/read/:profileId
export const markRead = async (req: Request, res: Response): Promise<void> => {
  const me = req.user!.id;
  const other = req.params.profileId;
  await supabase.from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', other).eq('receiver_id', me).is('read_at', null);
  sendSuccess(res, { ok: true });
};

// GET /api/chat/unread
export const unreadCount = async (req: Request, res: Response): Promise<void> => {
  const me = req.user!.id;
  const { count } = await supabase
    .from('messages').select('*', { count: 'exact', head: true })
    .eq('receiver_id', me).is('read_at', null);
  sendSuccess(res, { count: count ?? 0 });
};
