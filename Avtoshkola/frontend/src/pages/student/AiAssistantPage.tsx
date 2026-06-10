import { useEffect, useRef, useState, FormEvent } from 'react';
import { aiApi, AiChat } from '../../api/ai.api';
import { Spinner } from '../../components/common/Spinner';

const LIMIT = 10;

const SUGGESTIONS = [
  'Какво означава знак "Стоп"?',
  'Кога трябва да включа мигачи при смяна на лентата?',
  'Какво е безопасна дистанция?',
  'Кой има предимство на кръстовище без знаци?',
  'Какво правя при пробита гума на магистрала?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function AiAssistantPage() {
  const [chats, setChats] = useState<AiChat[]>([]);
  const [remaining, setRemaining] = useState(LIMIT);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    aiApi.getHistory()
      .then((res: { chats: AiChat[]; remaining: number }) => { setChats(res.chats); setRemaining(res.remaining); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, thinking]);

  const handleSubmit = async (e: FormEvent | null, overrideText?: string) => {
    e?.preventDefault();
    const q = (overrideText ?? text).trim();
    if (!q || thinking || remaining <= 0) return;
    setText('');
    setError('');
    setThinking(true);

    const optimistic: AiChat = {
      id: `tmp-${Date.now()}`,
      profile_id: '',
      question: q,
      answer: '',
      created_at: new Date().toISOString(),
    };
    setChats(prev => [...prev, optimistic]);

    try {
      const { answer, remaining: rem } = await aiApi.ask(q);
      setChats(prev => prev.map(c => c.id === optimistic.id ? { ...c, answer } : c));
      setRemaining(rem);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Грешка при свързване с AI асистента.';
      setError(msg);
      setChats(prev => prev.filter(c => c.id !== optimistic.id));
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI Асистент</h2>
          <p className="text-sm text-gray-500 mt-0.5">Задавай въпроси по теория за шофьорска книжка</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border ${
          remaining === 0
            ? 'bg-red-50 border-red-200 text-red-600'
            : remaining <= 3
            ? 'bg-orange-50 border-orange-200 text-orange-600'
            : 'bg-green-50 border-green-200 text-green-600'
        }`}>
          <span className={`h-2 w-2 rounded-full ${remaining === 0 ? 'bg-red-400' : remaining <= 3 ? 'bg-orange-400' : 'bg-green-400'}`} />
          {remaining}/{LIMIT} въпроса днес
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner className="h-6 w-6 text-blue-500" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-semibold">Задай въпрос по теория</p>
              <p className="text-gray-400 text-sm mt-1">Имаш {remaining} въпроса за днес</p>
            </div>
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Примерни въпроси</p>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSubmit(null, s)}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chats.map(chat => (
              <div key={chat.id} className="space-y-3">
                {/* Question */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                    {chat.question}
                  </div>
                </div>
                {/* Answer */}
                {chat.answer ? (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {chat.answer}
                      </div>
                    </div>
                  </div>
                ) : thinking && chat.id.startsWith('tmp-') ? (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex-shrink-0">
        <div className={`flex gap-2 bg-white rounded-2xl border shadow-sm p-2 transition-all duration-150 ${
          remaining === 0 ? 'border-gray-100 opacity-60' : 'border-gray-200 focus-within:border-blue-300 focus-within:shadow-md'
        }`}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(null); } }}
            placeholder={remaining === 0 ? 'Достигнат е дневният лимит' : 'Задай въпрос по теория... (Enter за изпращане)'}
            disabled={remaining === 0 || thinking}
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none px-2 py-1 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!text.trim() || thinking || remaining === 0}
            className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center self-end flex-shrink-0
                       hover:bg-blue-700 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {thinking ? (
              <Spinner className="h-4 w-4 text-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Shift+Enter за нов ред · Асистентът отговаря само на въпроси за шофьорска книжка
        </p>
      </form>
    </div>
  );
}
