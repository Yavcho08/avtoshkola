import { useEffect, useState, FormEvent } from 'react';
import { vehiclesApi } from '../../api/vehicles.api';
import { categoriesApi } from '../../api/categories.api';
import { VehicleWithCategory, Category } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

type ExpiringVehicle = VehicleWithCategory & { gtp_expired: boolean };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  active:    { dot: 'bg-green-400', label: 'Активно',    badge: 'bg-green-50 text-green-700' },
  in_repair: { dot: 'bg-orange-400',label: 'В ремонт',   badge: 'bg-orange-50 text-orange-700' },
  retired:   { dot: 'bg-gray-400',  label: 'Извадено',   badge: 'bg-gray-100 text-gray-600' },
};

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithCategory[]>([]);
  const [expiring, setExpiring] = useState<ExpiringVehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    registration_number: '', make: '', model: '', category_id: '', technical_inspection_date: '',
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
      if (catRes.length > 0) setForm(f => ({ ...f, category_id: catRes[0].id }));
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
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Превозни средства</h2>
          <p className="text-sm text-gray-500 mt-0.5">{vehicles.length} регистрирани МПС</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ново МПС
        </button>
      </div>

      {/* GTP alerts */}
      {expiring.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 mb-2">ГТП — изтичащи срокове ({expiring.length})</p>
              <div className="space-y-1.5">
                {expiring.map(v => {
                  const days = daysUntil(v.technical_inspection_date);
                  return (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono font-semibold text-amber-900">{v.registration_number}</span>
                      <span className={v.gtp_expired ? 'text-red-700 font-bold' : 'text-amber-700'}>
                        {v.gtp_expired ? 'Изтекло!' : `${days} дни`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Няма регистрирани МПС</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Рег. номер', 'Марка / Модел', 'Категория', 'ГТП до', 'Статус', 'Действия'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(v => {
                  const days = daysUntil(v.technical_inspection_date);
                  const gtpWarning = days <= 30;
                  const statusConf = STATUS_CONFIG[v.status] ?? { dot: 'bg-gray-400', label: v.status, badge: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={v.id} className="hover:bg-cyan-50/30 transition-colors duration-100">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-900">{v.registration_number}</td>
                      <td className="px-5 py-3.5 text-gray-700">{v.make} {v.model}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg text-xs">{v.categories?.name ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-medium ${gtpWarning ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(v.technical_inspection_date)}
                          {gtpWarning && (
                            <span className="ml-1 text-xs font-bold">{days <= 0 ? '(изтекло)' : `(${days}д)`}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConf.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {v.status === 'active' && (
                          <button onClick={() => handleStatusChange(v.id, 'in_repair')}
                            className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors">
                            → В ремонт
                          </button>
                        )}
                        {v.status === 'in_repair' && (
                          <button onClick={() => handleStatusChange(v.id, 'active')}
                            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
                            → Активен
                          </button>
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
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <Input label="Рег. номер" value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} required placeholder="CB 1234 AB" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Марка" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} required />
            <Input label="Модел" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Категория</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={selectCls}>
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
