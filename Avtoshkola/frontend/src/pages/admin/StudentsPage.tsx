import { useEffect, useState, FormEvent } from 'react';
import { studentsApi } from '../../api/students.api';
import { StudentWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

const STATUS_OPTIONS = [
  { value: '',          label: 'Всички'    },
  { value: 'active',    label: 'Активни'   },
  { value: 'graduated', label: 'Завършили' },
  { value: 'dropped',   label: 'Отписани'  },
];

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  active:    { dot: 'bg-green-400', label: 'Активен',   badge: 'bg-green-50 text-green-700'   },
  graduated: { dot: 'bg-blue-400',  label: 'Завършил',  badge: 'bg-blue-50 text-blue-700'     },
  dropped:   { dot: 'bg-red-400',   label: 'Отписан',   badge: 'bg-red-50 text-red-700'       },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  return <>{((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()}</>;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const LIMIT = 20;

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentsApi.list({ page, limit: LIMIT, search: search || undefined, status: status || undefined });
      setStudents(res.data);
      setTotal(res.total);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadStudents(); }, [page, status]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); void loadStudents(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', egn: '' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await studentsApi.create({ ...form, password: form.password });
      setStudents(prev => [created, ...prev]);
      setTotal(t => t + 1);
      setIsModalOpen(false);
      setForm({ email: '', password: '', first_name: '', last_name: '', phone: '', egn: '' });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Студенти</h2>
          <p className="text-sm text-gray-500 mt-0.5">Общо {total} записа</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Нов студент
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Търсене по име или ЕГН…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { setStatus(o.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                ${status === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Няма намерени студенти</p>
            <p className="text-gray-400 text-sm mt-1">Опитайте с различни критерии за търсене</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Студент', 'ЕГН', 'Телефон', 'Записан на', 'Статус'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => {
                  const fullName = `${s.profiles.first_name} ${s.profiles.last_name}`;
                  const statusConf = STATUS_CONFIG[s.status] ?? { dot: 'bg-gray-400', label: s.status, badge: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors duration-100">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            <Initials name={fullName} />
                          </div>
                          <span className="font-semibold text-gray-900">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">{s.egn}</td>
                      <td className="px-5 py-3.5 text-gray-600">{s.profiles.phone ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(s.registration_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConf.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500">
            <span>Показани {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} от {total}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                ← Предишна
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Следваща →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Нов студент">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Собствено име" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
            <Input label="Фамилия" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
          </div>
          <Input label="ЕГН" value={form.egn} onChange={e => setForm(f => ({ ...f, egn: e.target.value }))} maxLength={10} hint="10 цифри" required />
          <Input label="Имейл" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Парола" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Input label="Телефон" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Създай</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
