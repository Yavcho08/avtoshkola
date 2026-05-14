import { useEffect, useState, FormEvent } from 'react';
import { instructorsApi } from '../../api/instructors.api';
import { InstructorWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { extractErrorMessage } from '../../api/client';

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>+ Нов инструктор</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : instructors.length === 0 ? (
          <EmptyState title="Няма регистрирани инструктори" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Имена', 'Лиценз №', 'Телефон', 'Активен', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instructors.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{i.profiles.first_name} {i.profiles.last_name}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{i.license_number}</td>
                  <td className="px-4 py-3 text-gray-600">{i.profiles.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${i.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="ml-2 text-gray-700">{i.is_active ? 'Да' : 'Не'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(i.id, i.is_active)}>
                      {i.is_active ? 'Деактивирай' : 'Активирай'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Нов инструктор">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Собствено" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
            <Input label="Фамилия" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
          </div>
          <Input label="Лиценз №" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} required />
          <Input label="Имейл" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Парола" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Input label="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Създай</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
