import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) { setState('subscribed'); return; }
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
    }).catch(() => setState('unsupported'));
  }, []);

  const subscribe = async () => {
    setError(null);
    setState('loading');

    try {
      // 1. Explicitly request permission first — shows clear browser dialog
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setError('Разрешението за нотификации е отказано. Разреши го от иконата за катинар в адресната лента.');
        return;
      }

      // 2. Get VAPID key from backend
      const keyRes = await apiClient.get<{ data: { publicKey: string } }>('/push/vapid-public-key');
      const publicKey = keyRes.data.data?.publicKey;
      if (!publicKey) throw new Error('Липсва VAPID ключ');

      // 3. Subscribe via service worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 4. Save subscription to backend
      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: Record<string, string> };
      await apiClient.post('/push/subscribe', { endpoint, keys });

      setState('subscribed');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Неизвестна грешка';
      setError(msg);
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiClient.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } catch {
      setState('subscribed');
    }
  };

  return { state, error, subscribe, unsubscribe };
}
