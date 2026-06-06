import { useEffect, useState, FormEvent } from 'react';
import { apiClient } from '../../api/client';
import { Spinner } from '../../components/common/Spinner';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor';
  email: string;
}

export default function AdminEmailsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<{ data: Recipient[] }>('/emails/recipients')
      .then(r => setRecipients(r.data.data))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = recipients.filter(r => {
    if (roleFilter !== 'all' && r.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.first_name.toLowerCase().includes(q) ||
             r.last_name.toLowerCase().includes(q) ||
             r.email.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleAll = () => {
    if (filtered.every(r => selected.has(r.email))) {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(r => s.delete(r.email)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(r => s.add(r.email)); return s; });
    }
  };

  const toggle = (email: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(email) ? s.delete(email) : s.add(email);
      return s;
    });
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected.size) { setError('Изберете поне един получател.'); return; }
    if (!subject.trim()) { setError('Въведете тема.'); return; }
    if (!body.trim()) { setError('Въведете съдържание.'); return; }

    setError('');
    setResult(null);
    setIsSending(true);
    try {
      const res = await apiClient.post<{ data: { sent: number; total: number } }>('/emails/send', {
        to: [...selected],
        subject: subject.trim(),
        body: body.trim(),
      });
      setResult(res.data.data);
      setSubject('');
      setBody('');
      setSelected(new Set());
    } catch {
      setError('Грешка при изпращане. Опитайте отново.');
    } finally {
      setIsSending(false);
    }
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.email));

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Изпрати имейл</h2>
        <p className="text-sm text-gray-500 mt-0.5">Изпращане на съобщения до студенти и инструктори</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — recipient list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <p className="text-sm font-bold text-gray-700">
              Получатели
              {selected.size > 0 && (
                <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {selected.size} избрани
                </span>
              )}
            </p>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Търсене..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role filter */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {([['all', 'Всички'], ['student', 'Курсисти'], ['instructor', 'Инструктори']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setRoleFilter(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                    ${roleFilter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Select all */}
            <button onClick={toggleAll}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${allFilteredSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {allFilteredSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {allFilteredSelected ? 'Премахни всички' : `Избери всички (${filtered.length})`}
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 max-h-80">
            {isLoading ? (
              <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-primary-600" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">Няма намерени получатели</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <button key={r.email} onClick={() => toggle(r.email)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50/50 transition-colors ${selected.has(r.email) ? 'bg-blue-50/70' : ''}`}>
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(r.email) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selected.has(r.email) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0
                      ${r.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {r.role === 'student' ? 'Курсист' : 'Инструктор'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — compose */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-sm font-bold text-gray-700">Съставяне на съобщение</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {result && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700 font-medium">
                  Изпратено успешно до {result.sent} от {result.total} получателя!
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Тема</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Важно съобщение от автошколата"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Съдържание</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                placeholder="Уважаеми курсисти,&#10;&#10;Уведомяваме Ви, че..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{body.length} символа</p>
            </div>

            <button
              type="submit"
              disabled={isSending || selected.size === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
            >
              {isSending ? (
                <><Spinner className="h-4 w-4 text-white" /> Изпращане...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {selected.size > 0 ? `Изпрати до ${selected.size} получател${selected.size === 1 ? 'я' : 'и'}` : 'Изберете получатели'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
