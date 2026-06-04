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

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) { setState('subscribed'); return; }
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
    });
  }, []);

  const subscribe = async () => {
    setState('loading');
    try {
      const { data: keyData } = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: Record<string, string> };
      await apiClient.post('/push/subscribe', { endpoint, keys });
      setState('subscribed');
    } catch {
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
    }
  };

  const unsubscribe = async () => {
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

  return { state, subscribe, unsubscribe };
}
