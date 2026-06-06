import { apiClient } from './client';

export interface Contact {
  profile_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const d = (res: any) => res.data?.data ?? res.data;

export const chatApi = {
  getContacts:  ()                             => apiClient.get('/chat/contacts').then(d),
  getMessages:  (profileId: string)            => apiClient.get(`/chat/messages/${profileId}`).then(d),
  send:         (receiver_id: string, content: string) =>
                  apiClient.post('/chat/send', { receiver_id, content }).then(d),
  markRead:     (profileId: string)            => apiClient.patch(`/chat/read/${profileId}`),
  unreadCount:  ()                             => apiClient.get('/chat/unread').then(r => d(r)?.count ?? 0),
};
