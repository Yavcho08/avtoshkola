import { useEffect, useState, FormEvent } from 'react';
import { instructorsApi } from '../../api/instructors.api';
import { InstructorWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  return <>{((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()}</>;
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', license_number: '' });

  useEffect(() => {
    instructorsApi.list({ limit: 100 })
      .then(res => setInstructors(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await instructorsApi.create(form);
      setInstructors(prev => [...prev, created]);
      setIsModalOpen(false);
      setForm({ email: '', password: '', first_name: '', last_name: '', phone: '', license_number: '' });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await instructorsApi.update(id, { is_active: !isActive });
      setInstructors(prev => prev.map(i => i.id === id ? updated : i));
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Инструктори</h2>
          <p className="text-sm text-gray-500 mt-0.5">{instructors.length} регистрирани инструктора</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Нов инструктор
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Няма регистрирани инструктори</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {['Инструктор', 'Лиценз №', 'Телефон', 'Статус', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {instructors.map(i => {
                const fullName = `${i.profiles.first_name} ${i.profiles.last_name}`;
                return (
                  <tr key={i.id} className="hover:bg-violet-50/30 transition-colors duration-100">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          <Initials name={fullName} />
                        </div>
                        <span className="font-semibold text-gray-900">{fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">{i.license_number}</td>
                    <td className="px-5 py-3.5 text-gray-600">{i.profiles.phone ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg
                        ${i.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${i.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                        {i.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(i.id, i.is_active)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150
                          ${i.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                      >
                        {i.is_active ? 'Деактивирай' : 'Активирай'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Нов инструктор">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Собствено" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
            <Input label="Фамилия"  value={form.last_name}  onChange={e => setForm(f => ({ ...f, last_name:  e.target.value }))} required />
          </div>
          <Input label="Лиценз №" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} required />
          <Input label="Имейл"    type="email"    value={form.email}    onChange={e => setForm(f => ({ ...f, email:    e.target.value }))} required />
          <Input label="Парола"   type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Input label="Телефон"  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Създай</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
