import webpush from 'web-push';
import { supabase } from '../config/supabase';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@avtoshkola.bg',
  process.env.VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushToUser(profileId: string, payload: PushPayload): Promise<void> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('profile_id', profileId);

  if (!subs?.length) return;

  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) dead.push(sub.id);
      }
    }),
  );

  if (dead.length) {
    await supabase.from('push_subscriptions').delete().in('id', dead);
  }
}

export async function sendPushToMany(profileIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(profileIds.map(id => sendPushToUser(id, payload)));
}
