import { useEffect, useState, FormEvent } from 'react';
import { vehiclesApi } from '../../api/vehicles.api';
import { categoriesApi } from '../../api/categories.api';
import { VehicleWithCategory, Category } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { extractErrorMessage } from '../../api/client';

type ExpiringVehicle = VehicleWithCategory & { gtp_expired: boolean };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG');
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithCategory[]>([]);
  const [expiring, setExpiring] = useState<ExpiringVehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    registration_number: '', make: '', model: '',
    category_id: '', technical_inspection_date: '',
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const [listRes, expiringRes, catRes] = await Promise.all([
        vehiclesApi.list({ limit: 100 }),
        vehiclesApi.getExpiring(60),
        categoriesApi.list(),
      ]);
      setVehicles(listRes.data);
      setExpiring(expiringRes);
      setCategories(catRes);
      if (catRes.length > 0) {
        setForm(f => ({ ...f, category_id: catRes[0].id }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await vehiclesApi.create(form);
      setVehicles(prev => [...prev, created]);
      setIsModalOpen(false);
      setForm({ registration_number: '', make: '', model: '', category_id: categories[0]?.id ?? '', technical_inspection_date: '' });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await vehiclesApi.update(id, { status });
      setVehicles(prev => prev.map(v => v.id === id ? updated : v));
    } catch { /* show toast in a real app */ }
  };

  return (
    <div className="space-y-6">
      {/* GTP alerts */}
      {expiring.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ⚠ ГТП — изтичащи срокове ({expiring.length})
          </h3>
          <div className="space-y-1">
            {expiring.map(v => {
              const days = daysUntil(v.technical_inspection_date);
              return (
                <div key={v.id} className="text-sm text-yellow-700 flex justify-between">
                  <span className="font-mono font-medium">{v.registration_number}</span>
                  <span>
                    {v.gtp_expired
                      ? <span className="text-red-700 font-semibold">Изтекло!</span>
                      : `${days} дни`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>+ Ново МПС</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : vehicles.length === 0 ? (
          <EmptyState title="Няма регистрирани МПС" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Рег. номер', 'Марка / Модел', 'Категория', 'ГТП до', 'Статус', 'Действия'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => {
                  const days = daysUntil(v.technical_inspection_date);
                  const gtpWarning = days <= 30;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">{v.registration_number}</td>
                      <td className="px-4 py-3 text-gray-700">{v.make} {v.model}</td>
                      <td className="px-4 py-3"><span className="font-bold text-primary-700">{v.categories?.name ?? '—'}</span></td>
                      <td className={`px-4 py-3 font-medium ${gtpWarning ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatDate(v.technical_inspection_date)}
                        {gtpWarning && <span className="ml-1 text-xs">({days <= 0 ? 'изтекло' : `${days}д`})</span>}
                      </td>
                      <td className="px-4 py-3"><Badge label={v.status} /></td>
                      <td className="px-4 py-3">
                        {v.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(v.id, 'in_repair')}>
                            → В ремонт
                          </Button>
                        )}
                        {v.status === 'in_repair' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(v.id, 'active')}>
                            → Активен
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ново МПС">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <Input label="Рег. номер" value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} required placeholder="CB 1234 AB" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Марка" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} required />
            <Input label="Модел" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Категория</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="ГТП (срок)" type="date" value={form.technical_inspection_date} onChange={e => setForm(f => ({ ...f, technical_inspection_date: e.target.value }))} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Добави</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
