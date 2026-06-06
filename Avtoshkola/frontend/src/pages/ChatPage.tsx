import { useEffect, useRef, useState, FormEvent } from 'react';
import { chatApi, Contact, Message } from '../api/chat.api';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/common/Spinner';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Днес';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
}

function Initials({ name }: { name: string }) {
  const p = name.trim().split(' ');
  return <>{((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()}</>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load contacts
  useEffect(() => {
    chatApi.getContacts()
      .then(setContacts)
      .finally(() => setLoadingContacts(false));
  }, []);

  // Load messages when contact selected
  useEffect(() => {
    if (!selected) return;
    setLoadingMessages(true);
    chatApi.getMessages(selected.profile_id)
      .then(msgs => { setMessages(msgs); chatApi.markRead(selected.profile_id); })
      .finally(() => setLoadingMessages(false));

    // Poll every 3s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      chatApi.getMessages(selected.profile_id).then(msgs => {
        setMessages(msgs);
        chatApi.markRead(selected.profile_id);
      });
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await chatApi.send(selected.profile_id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
      inputRef.current?.focus();
    } catch { /* noop */ }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const label = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === label) last.msgs.push(m);
    else grouped.push({ date: label, msgs: [m] });
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-6xl bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

      {/* Left — contacts */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-slate-100">Съобщения</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {user?.role === 'student' ? 'Вашите инструктори' : 'Вашите курсисти'}
          </p>
        </div>

        {loadingContacts ? (
          <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-primary-600" /></div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
            <svg className="w-10 h-10 text-gray-200 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-slate-500">Няма контакти</p>
            <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Трябват насрочени занятия</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {contacts.map(c => {
              const isActive = selected?.profile_id === c.profile_id;
              const fullName = `${c.first_name} ${c.last_name}`;
              return (
                <button
                  key={c.profile_id}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    <Initials name={fullName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-slate-100'}`}>
                      {fullName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                      {c.role === 'instructor' ? 'Инструктор' : 'Курсист'}
                    </p>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right — chat area */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="h-20 w-20 rounded-2xl bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600 dark:text-slate-300">Изберете контакт</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Изберете от списъка вляво за да започнете разговор</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              <Initials name={`${selected.first_name} ${selected.last_name}`} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{selected.first_name} {selected.last_name}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{selected.role === 'instructor' ? 'Инструктор' : 'Курсист'}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-1 bg-gray-50/50 dark:bg-slate-900/50">
            {loadingMessages ? (
              <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-primary-600" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-gray-400 dark:text-slate-500">Нямате съобщения с тази особа</p>
                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Изпратете първото съобщение</p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                    <span className="text-xs text-gray-400 dark:text-slate-500 font-medium px-2">{group.date}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  </div>
                  {group.msgs.map((m, i) => {
                    const isMe = m.sender_id === user?.id;
                    const prevSame = i > 0 && group.msgs[i - 1].sender_id === m.sender_id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-0.5' : 'mt-3'}`}>
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${isMe
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 border border-gray-100 dark:border-slate-600 rounded-bl-sm shadow-sm'
                            }`}>
                            {m.content}
                          </div>
                          <p className={`text-[10px] text-gray-300 dark:text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity
                            ${isMe ? 'text-right' : 'text-left'}`}>
                            {fmtTime(m.created_at)}
                            {isMe && m.read_at && ' · Прочетено'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишете съобщение... (Enter за изпращане, Shift+Enter за нов ред)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
