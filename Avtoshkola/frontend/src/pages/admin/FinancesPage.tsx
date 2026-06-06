import { useEffect, useState, FormEvent } from 'react';
import { paymentsApi } from '../../api/payments.api';
import { expensesApi } from '../../api/expenses.api';
import { studentsApi } from '../../api/students.api';
import { PaymentWithStudent, Expense, StudentWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
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

const PAY_STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  paid:    { dot: 'bg-green-400', label: 'Платено',    badge: 'bg-green-50 text-green-700'   },
  pending: { dot: 'bg-blue-400',  label: 'Изчакващо', badge: 'bg-blue-50 text-blue-700'     },
  overdue: { dot: 'bg-red-400',   label: 'Просрочено', badge: 'bg-red-50 text-red-700'       },
};

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function SummaryCard({ value, label, icon, bg, textColor }:
  { value: string; label: string; icon: React.ReactNode; bg: string; textColor: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
      <div>
        <p className={`text-xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminFinancesPage() {
  const [tab, setTab] = useState<Tab>('payments');
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
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
      const [paymentsRes, expensesRes, summaryRes, studentsRes] = await Promise.all([
        paymentsApi.list({ limit: 50 }),
        expensesApi.list({ limit: 50 }),
        paymentsApi.getSummary(),
        studentsApi.list({ limit: 500 }),
      ]);
      setPayments(paymentsRes.data);
      setExpenses(expensesRes.data);
      setSummary(summaryRes);
      setStudents(studentsRes.data);
      if (studentsRes.data.length > 0 && !paymentForm.student_id) {
        setPaymentForm(f => ({ ...f, student_id: studentsRes.data[0].id }));
      }
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
      setPaymentForm(f => ({ ...f, amount: '', due_date: '' }));
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
      setExpenseForm(f => ({ ...f, description: '', amount: '', expense_date: '' }));
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-7xl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Финанси</h2>
        <p className="text-sm text-gray-500 mt-0.5">Плащания и разходи на автошколата</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard value={fmt(summary.monthlyRevenue)} label="Приходи (месец)"  bg="bg-green-50"  textColor="text-green-600"
            icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <SummaryCard value={fmt(summary.monthlyExpenses)} label="Разходи (месец)" bg="bg-orange-50" textColor="text-orange-600"
            icon={<svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          />
          <SummaryCard value={fmt(summary.pendingPayments)} label="Изчакващо"       bg="bg-blue-50"   textColor="text-blue-600"
            icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <SummaryCard value={fmt(summary.overduePayments)} label="Просрочено"      bg="bg-red-50"    textColor="text-red-600"
            icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>
      )}

      {/* Tab + action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['payments', 'expenses'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'payments' ? 'Плащания' : 'Разходи'}
            </button>
          ))}
        </div>
        <button
          onClick={() => tab === 'payments' ? setIsPaymentModalOpen(true) : setIsExpenseModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {tab === 'payments' ? 'Ново плащане' : 'Нов разход'}
        </button>
      </div>

      {/* Payments table */}
      {tab === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {['Курсист', 'Тип', 'Сума', 'Падеж', 'Платено на', 'Статус', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => {
                    const statusConf = PAY_STATUS_CONFIG[p.status] ?? { dot: 'bg-gray-400', label: p.status, badge: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={p.id} className={`transition-colors duration-100 ${p.status === 'overdue' ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-green-50/20'}`}>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</td>
                        <td className="px-5 py-3.5 text-gray-600">{PAYMENT_TYPE_LABELS[p.type]}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-900">{fmt(Number(p.amount))}</td>
                        <td className="px-5 py-3.5 text-gray-500">{fmtDate(p.due_date)}</td>
                        <td className="px-5 py-3.5 text-gray-500">{p.payment_date ? fmtDate(p.payment_date) : '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConf.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.status !== 'paid' && (
                            <button onClick={() => markPaid(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors whitespace-nowrap">
                              Маркирай платено
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
      )}

      {/* Expenses table */}
      {tab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Описание', 'Категория', 'Сума', 'Дата'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-orange-50/20 transition-colors duration-100">
                    <td className="px-5 py-3.5 text-gray-900 font-medium">{ex.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700">
                        {EXPENSE_CAT_LABELS[ex.category]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">{fmt(Number(ex.amount))}</td>
                    <td className="px-5 py-3.5 text-gray-500">{fmtDate(ex.expense_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Ново плащане">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Курсист</label>
            <select value={paymentForm.student_id} onChange={e => setPaymentForm(f => ({ ...f, student_id: e.target.value }))} className={selectCls}>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles.first_name} {s.profiles.last_name} ({s.egn})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Сума (€)" type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} required />
            <Input label="Падеж" type="date" value={paymentForm.due_date} onChange={e => setPaymentForm(f => ({ ...f, due_date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип</label>
            <select value={paymentForm.type} onChange={e => setPaymentForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
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
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <Input label="Описание" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Сума (€)" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required />
            <Input label="Дата" type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Категория</label>
            <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
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
