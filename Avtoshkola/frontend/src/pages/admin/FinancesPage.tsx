import { useEffect, useState, FormEvent } from 'react';
import { paymentsApi } from '../../api/payments.api';
import { expensesApi } from '../../api/expenses.api';
import { PaymentWithStudent, Expense } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { StatCard } from '../../components/common/StatCard';
import { extractErrorMessage } from '../../api/client';

type Tab = 'payments' | 'expenses';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  installment: 'Вноска', full_course: 'Пълен курс',
  extra_hours: 'Допълн. часове', state_exam_fee: 'Такса ДАИ',
};

const EXPENSE_CAT_LABELS: Record<string, string> = {
  vehicle_maintenance: 'Поддръжка МПС', fuel: 'Гориво',
  salaries: 'Заплати', rent: 'Наем', other: 'Друго',
};

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(n);
}

export default function AdminFinancesPage() {
  const [tab, setTab] = useState<Tab>('payments');
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof paymentsApi.getSummary>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ student_id: '', amount: '', type: 'installment', due_date: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', expense_date: '', category: 'fuel' as string });

  const load = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, expensesRes, summaryRes] = await Promise.all([
        paymentsApi.list({ limit: 50 }),
        expensesApi.list({ limit: 50 }),
        paymentsApi.getSummary(),
      ]);
      setPayments(paymentsRes.data);
      setExpenses(expensesRes.data);
      setSummary(summaryRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const markPaid = async (id: string) => {
    try {
      const updated = await paymentsApi.update(id, { status: 'paid' });
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
    } catch { /* noop */ }
  };

  const handleCreatePayment = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await paymentsApi.create({ ...paymentForm, amount: Number(paymentForm.amount) });
      setPayments(prev => [created, ...prev]);
      setIsPaymentModalOpen(false);
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  const handleCreateExpense = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await expensesApi.create({ ...expenseForm, amount: Number(expenseForm.amount), category: expenseForm.category as never });
      setExpenses(prev => [created, ...prev]);
      setIsExpenseModalOpen(false);
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Приходи (месец)" value={fmt(summary.monthlyRevenue)} color="green" />
          <StatCard title="Разходи (месец)" value={fmt(summary.monthlyExpenses)} color="yellow" />
          <StatCard title="Изчакващо" value={fmt(summary.pendingPayments)} color="blue" />
          <StatCard title="Просрочено" value={fmt(summary.overduePayments)} color="red" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['payments', 'expenses'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'payments' ? 'Плащания' : 'Разходи'}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setIsPaymentModalOpen(true)}>+ Ново плащане</Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Студент', 'Тип', 'Сума', 'Падеж', 'Платено на', 'Статус', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</td>
                      <td className="px-4 py-3 text-gray-700">{PAYMENT_TYPE_LABELS[p.type]}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(Number(p.amount))}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(p.due_date).toLocaleDateString('bg-BG')}</td>
                      <td className="px-4 py-3 text-gray-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('bg-BG') : '—'}</td>
                      <td className="px-4 py-3"><Badge label={p.status} /></td>
                      <td className="px-4 py-3">
                        {p.status !== 'paid' && <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)}>Маркирай платено</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setIsExpenseModalOpen(true)}>+ Нов разход</Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Описание', 'Категория', 'Сума', 'Дата'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map(ex => (
                    <tr key={ex.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{ex.description}</td>
                      <td className="px-4 py-3 text-gray-700">{EXPENSE_CAT_LABELS[ex.category]}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(Number(ex.amount))}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(ex.expense_date).toLocaleDateString('bg-BG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Payment modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Ново плащане">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <Input label="ID на студент" value={paymentForm.student_id} onChange={e => setPaymentForm(f => ({ ...f, student_id: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Сума (лв.)" type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} required />
            <Input label="Падеж" type="date" value={paymentForm.due_date} onChange={e => setPaymentForm(f => ({ ...f, due_date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Тип</label>
            <select value={paymentForm.type} onChange={e => setPaymentForm(f => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsPaymentModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Добави</Button>
          </div>
        </form>
      </Modal>

      {/* Expense modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Нов разход">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <Input label="Описание" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Сума (лв.)" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required />
            <Input label="Дата" type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Категория</label>
            <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Object.entries(EXPENSE_CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsExpenseModalOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Добави</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
