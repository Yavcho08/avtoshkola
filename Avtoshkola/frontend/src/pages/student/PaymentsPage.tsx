import { useEffect, useState } from 'react';
import { paymentsApi } from '../../api/payments.api';
import { PaymentWithStudent } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  installment: 'Вноска', full_course: 'Пълен курс',
  extra_hours: 'Допълн. часове', state_exam_fee: 'Такса ДАИ',
};

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG');
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    paymentsApi.list({ limit: 100 }).then(res => setPayments(res.data)).finally(() => setIsLoading(false));
  }, []);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalOwed = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-green-700">{fmt(totalPaid)}</p>
          <p className="text-sm text-green-600 mt-1">Общо платено</p>
        </div>
        <div className={`border rounded-xl p-5 text-center ${totalOwed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-2xl font-bold ${totalOwed > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(totalOwed)}</p>
          <p className={`text-sm mt-1 ${totalOwed > 0 ? 'text-orange-500' : 'text-gray-400'}`}>За плащане</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : payments.length === 0 ? (
        <EmptyState title="Няма записи за плащания" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Тип', 'Сума', 'Падеж', 'Платено на', 'Фактура №', 'Статус'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.status === 'overdue' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3 text-gray-700">{PAYMENT_TYPE_LABELS[p.type]}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(p.due_date)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.payment_date ? fmtDate(p.payment_date) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{p.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
