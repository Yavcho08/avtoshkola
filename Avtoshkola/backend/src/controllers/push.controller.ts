import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/push/vapid-public-key  — public, no auth needed
export const getVapidPublicKey = (_req: Request, res: Response): void => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) { sendError(res, 'Push notifications not configured.', 503); return; }
  sendSuccess(res, { publicKey: key });
};

// POST /api/push/subscribe
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const profileId = req.user!.id;
  const { endpoint, keys } = req.body as { endpoint?: string; keys?: Record<string, string> };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    sendError(res, 'endpoint and keys (p256dh, auth) are required.', 422); return;
  }

  // Upsert by endpoint so re-subscribing doesn't duplicate
  const { error } = await supabase.from('push_subscriptions').upsert(
    { profile_id: profileId, endpoint, keys },
    { onConflict: 'endpoint' },
  );

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, { ok: true }, 201);
};

// DELETE /api/push/unsubscribe
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  const profileId = req.user!.id;
  const { endpoint } = req.body as { endpoint?: string };

  if (!endpoint) { sendError(res, 'endpoint is required.', 422); return; }

  await supabase.from('push_subscriptions')
    .delete()
    .eq('profile_id', profileId)
    .eq('endpoint', endpoint);

  sendSuccess(res, { ok: true });
};
