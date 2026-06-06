import { useEffect, useState, FormEvent } from 'react';
import { examsApi } from '../../api/exams.api';
import { studentsApi } from '../../api/students.api';
import { ExamWithStudent, StudentWithProfile } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

const EXAM_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  internal_theory:   { label: 'Вътр. теория',   bg: 'bg-violet-100', text: 'text-violet-700' },
  internal_practice: { label: 'Вътр. практика', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  state_theory:      { label: 'ДАИ теория',      bg: 'bg-amber-100',  text: 'text-amber-700'  },
  state_practice:    { label: 'ДАИ практика',    bg: 'bg-orange-100', text: 'text-orange-700' },
};

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  scheduled: { dot: 'bg-blue-400',  label: 'Насрочен',     badge: 'bg-blue-50 text-blue-700'   },
  passed:    { dot: 'bg-green-400', label: 'Издържан',     badge: 'bg-green-50 text-green-700'  },
  failed:    { dot: 'bg-red-400',   label: 'Неиздържан',  badge: 'bg-red-50 text-red-700'      },
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Всички типове' },
  { value: 'internal_theory',   label: 'Вътр. теория'   },
  { value: 'internal_practice', label: 'Вътр. практика' },
  { value: 'state_theory',      label: 'ДАИ теория'      },
  { value: 'state_practice',    label: 'ДАИ практика'    },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'scheduled', label: 'Насрочени'    },
  { value: 'passed',    label: 'Издържани'    },
  { value: 'failed',    label: 'Неиздържани' },
  { value: '',          label: 'Всички'       },
];

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamWithStudent[]>([]);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resultModal, setResultModal] = useState<ExamWithStudent | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ student_id: '', type: 'internal_theory', exam_date: '' });
  const [resultForm, setResultForm] = useState({ status: 'passed', score: '' });

  const load = async () => {
    setIsLoading(true);
    try {
      const [examsRes, studentsRes] = await Promise.all([
        examsApi.list({ type: typeFilter || undefined, status: statusFilter || undefined, limit: 50 }),
        studentsApi.list({ limit: 500 }),
      ]);
      setExams(examsRes.data);
      setStudents(studentsRes.data);
      if (studentsRes.data.length > 0 && !createForm.student_id) {
        setCreateForm(f => ({ ...f, student_id: studentsRes.data[0].id }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [typeFilter, statusFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await examsApi.create(createForm);
      setExams(prev => [created, ...prev]);
      setIsCreateOpen(false);
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  const handleResult = async (e: FormEvent) => {
    e.preventDefault();
    if (!resultModal) return;
    setIsSaving(true);
    try {
      const updated = await examsApi.update(resultModal.id, {
        status: resultForm.status,
        score: resultForm.score ? Number(resultForm.score) : null,
      });
      setExams(prev => prev.map(ex => ex.id === updated.id ? updated : ex));
      setResultModal(null);
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Изпити</h2>
          <p className="text-sm text-gray-500 mt-0.5">{exams.length} записа</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Status filter pills */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {STATUS_FILTER_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setStatusFilter(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${statusFilter === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Нов изпит
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Няма намерени изпити</p>
            <p className="text-gray-400 text-sm mt-1">Опитайте с различен филтър</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {['Курсист', 'Тип', 'Дата', 'Статус', 'Резултат', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exams.map(ex => {
                const typeConf = EXAM_TYPE_LABELS[ex.type] ?? { label: ex.type, bg: 'bg-gray-100', text: 'text-gray-600' };
                const statusConf = STATUS_CONFIG[ex.status] ?? { dot: 'bg-gray-400', label: ex.status, badge: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={ex.id} className="hover:bg-amber-50/20 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {ex.students?.profiles?.first_name} {ex.students?.profiles?.last_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="block">{fmtDate(ex.exam_date)}</span>
                      <span className="text-xs text-gray-400">{fmtTime(ex.exam_date)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConf.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-semibold">{ex.score != null ? ex.score : '—'}</td>
                    <td className="px-5 py-3.5">
                      {ex.status === 'scheduled' && (
                        <button
                          onClick={() => { setResultModal(ex); setResultForm({ status: 'passed', score: '' }); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          Въведи резултат
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Нов изпит">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Курсист</label>
            <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))} className={selectCls}>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles.first_name} {s.profiles.last_name} ({s.egn})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип изпит</label>
            <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
              {Object.entries(EXAM_TYPE_LABELS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>
          <Input label="Дата и час" type="datetime-local" value={createForm.exam_date} onChange={e => setCreateForm(f => ({ ...f, exam_date: e.target.value }))} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Насрочи</Button>
          </div>
        </form>
      </Modal>

      {/* Result modal */}
      <Modal isOpen={!!resultModal} onClose={() => setResultModal(null)} title="Въвеждане на резултат" size="sm">
        <form onSubmit={handleResult} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Резултат</label>
            <select value={resultForm.status} onChange={e => setResultForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
              <option value="passed">Издържан</option>
              <option value="failed">Неиздържан</option>
            </select>
          </div>
          <Input label="Точки (по избор)" type="number" min="0" max="100" value={resultForm.score} onChange={e => setResultForm(f => ({ ...f, score: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setResultModal(null)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запази</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
