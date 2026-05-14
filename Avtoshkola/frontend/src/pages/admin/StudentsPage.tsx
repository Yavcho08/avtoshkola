import { useEffect, useState, FormEvent } from 'react';
import { studentsApi } from '../../api/students.api';
import { StudentWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { extractErrorMessage } from '../../api/client';

const STATUS_OPTIONS = [
  { value: '', label: 'Всички' },
  { value: 'active', label: 'Активни' },
  { value: 'graduated', label: 'Завършили' },
  { value: 'dropped', label: 'Отписани' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG');
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); void loadStudents(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Create student form
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Търсене по име или ЕГН…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="sm:w-72"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button className="sm:ml-auto" onClick={() => setIsModalOpen(true)}>
          + Нов студент
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : students.length === 0 ? (
          <EmptyState title="Няма намерени студенти" description="Опитайте с различни критерии за търсене." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Имена', 'ЕГН', 'Телефон', 'Записан на', 'Статус'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.profiles.first_name} {s.profiles.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{s.egn}</td>
                    <td className="px-4 py-3 text-gray-600">{s.profiles.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.registration_date)}</td>
                    <td className="px-4 py-3"><Badge label={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            <span>Показани {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} от {total}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Предишна</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Следваща →</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Нов студент">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
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
