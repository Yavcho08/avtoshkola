import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentsApi, stripeApi } from '../../api/payments.api';
import { PaymentWithStudent } from '../../types';
import { Spinner } from '../../components/common/Spinner';

const PAYMENT_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  installment:    { label: 'Вноска',            bg: 'bg-blue-100',   text: 'text-blue-700'   },
  full_course:    { label: 'Пълен курс',         bg: 'bg-violet-100', text: 'text-violet-700' },
  extra_hours:    { label: 'Допълн. часове',     bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
  state_exam_fee: { label: 'Такса ДАИ',          bg: 'bg-orange-100', text: 'text-orange-700' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; row: string }> = {
  paid:    { label: 'Платено',    dot: 'bg-green-400',  row: ''              },
  pending: { label: 'Изчакващо', dot: 'bg-blue-400',   row: ''              },
  overdue: { label: 'Просрочено', dot: 'bg-red-400',   row: 'bg-red-50/40'  },
};

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function EmptyPayments() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Няма записи за плащания</p>
      <p className="text-gray-400 text-sm mt-1">Информацията ще се появи след първото плащане</p>
    </div>
  );
}

export default function StudentPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'cancelled'; msg: string } | null>(null);

  const loadPayments = useCallback(() => {
    return paymentsApi.list({ limit: 100 }).then(res => setPayments(res.data));
  }, []);

  // Handle Stripe redirect-back (success or cancel)
  useEffect(() => {
    const success    = searchParams.get('success');
    const cancelled  = searchParams.get('cancelled');
    const sessionId  = searchParams.get('session_id');
    const paymentId  = searchParams.get('payment_id');

    if (cancelled === 'true') {
      setBanner({ type: 'cancelled', msg: 'Плащането беше отменено.' });
      setSearchParams({}, { replace: true });
      return;
    }

    if (success === 'true' && sessionId && paymentId) {
      setConfirming(true);
      setSearchParams({}, { replace: true });

      stripeApi
        .confirmPayment(sessionId, paymentId)
        .then(() => {
          setBanner({ type: 'success', msg: 'Плащането беше успешно! Статусът е обновен.' });
          return loadPayments();
        })
        .catch(() => {
          setBanner({ type: 'error', msg: 'Плащането беше извършено, но статусът не можа да се обнови. Свържете се с администратора.' });
        })
        .finally(() => setConfirming(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPayments().finally(() => setIsLoading(false));
  }, [loadPayments]);

  const handlePay = async (paymentId: string) => {
    setCheckingOut(paymentId);
    try {
      const { url } = await stripeApi.createCheckoutSession(paymentId);
      window.location.href = url;
    } catch {
      setBanner({ type: 'error', msg: 'Грешка при създаване на плащане. Моля, опитайте отново.' });
      setCheckingOut(null);
    }
  };

  const totalPaid  = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalOwed  = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Моите плащания</h2>
        <p className="text-sm text-gray-500 mt-0.5">История и статус на всички твои плащания</p>
      </div>

      {/* Confirming overlay */}
      {confirming && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          <Spinner className="h-4 w-4 text-blue-500" />
          Потвърждаване на плащането…
        </div>
      )}

      {/* Success / error / cancel banner */}
      {banner && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          banner.type === 'success'   ? 'bg-green-50 border-green-200 text-green-800' :
          banner.type === 'cancelled' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                        'bg-red-50 border-red-200 text-red-700'
        }`}>
          {banner.type === 'success' && (
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="ml-auto text-current opacity-50 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Общо платено</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${totalOwed > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <svg className={`w-6 h-6 ${totalOwed > 0 ? 'text-orange-400' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-xl font-bold ${totalOwed > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(totalOwed)}</p>
            <p className="text-sm text-gray-500 mt-0.5">За плащане</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <svg className={`w-6 h-6 ${overdueCount > 0 ? 'text-red-400' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Просрочени</p>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyPayments />
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const typeConf   = PAYMENT_TYPE_LABELS[p.type]   ?? { label: p.type,   bg: 'bg-gray-100', text: 'text-gray-600' };
            const statusConf = STATUS_CONFIG[p.status] ?? { label: p.status, dot: 'bg-gray-400', row: '' };
            const canPay     = p.status === 'pending' || p.status === 'overdue';
            const isProcessing = checkingOut === p.id;

            return (
              <div key={p.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 ${statusConf.row}`}>
                <div className="flex items-center gap-4">
                  {/* Amount box */}
                  <div className={`h-14 w-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${typeConf.bg}`}>
                    <span className={`text-xs font-bold leading-none ${typeConf.text}`}>€</span>
                    <span className={`text-base font-extrabold leading-tight ${typeConf.text}`}>
                      {Number(p.amount).toLocaleString('bg-BG')}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        {statusConf.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span>Падеж: <span className="text-gray-700 font-medium">{fmtDate(p.due_date)}</span></span>
                      {p.payment_date && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>Платено: <span className="text-gray-700 font-medium">{fmtDate(p.payment_date)}</span></span>
                        </>
                      )}
                    </div>

                    {p.invoice_number && (
                      <p className="text-xs font-mono text-gray-400 mt-1">Фактура: {p.invoice_number}</p>
                    )}
                  </div>

                  {/* Right side: amount + pay button */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <p className="text-xl font-extrabold text-gray-900">{fmt(Number(p.amount))}</p>

                    {p.status === 'overdue' && (
                      <p className="text-xs text-red-500 font-medium">Просрочено!</p>
                    )}

                    {canPay && (
                      <button
                        onClick={() => handlePay(p.id)}
                        disabled={isProcessing || checkingOut !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-primary-600 text-white hover:bg-primary-700 active:scale-95
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        {isProcessing ? (
                          <>
                            <Spinner className="h-3 w-3 text-white" />
                            Зареждане…
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Плати онлайн
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
