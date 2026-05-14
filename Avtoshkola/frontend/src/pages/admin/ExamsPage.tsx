import { useEffect, useState, FormEvent } from 'react';
import { examsApi } from '../../api/exams.api';
import { ExamWithStudent } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { extractErrorMessage } from '../../api/client';

const EXAM_TYPE_LABELS: Record<string, string> = {
  internal_theory: 'Вътрешна теория', internal_practice: 'Вътрешна практика',
  state_theory: 'ДАИ теория', state_practice: 'ДАИ практика',
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resultModal, setResultModal] = useState<ExamWithStudent | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ student_id: '', type: 'internal_theory', exam_date: '' });
  const [resultForm, setResultForm] = useState({ status: 'passed', score: '' });

  const load = () => {
    setIsLoading(true);
    examsApi.list({ type: typeFilter || undefined, status: statusFilter || undefined, limit: 50 })
      .then(res => setExams(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Всички типове</option>
          {Object.entries(EXAM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Всички статуси</option>
          <option value="scheduled">Насрочени</option>
          <option value="passed">Издържани</option>
          <option value="failed">Неиздържани</option>
        </select>
        <Button className="ml-auto" onClick={() => setIsCreateOpen(true)}>+ Нов изпит</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : exams.length === 0 ? (
          <EmptyState title="Няма намерени изпити" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Студент', 'Тип', 'Дата', 'Статус', 'Резултат', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.map(ex => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {ex.students?.profiles?.first_name} {ex.students?.profiles?.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{EXAM_TYPE_LABELS[ex.type]}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(ex.exam_date).toLocaleDateString('bg-BG')}</td>
                  <td className="px-4 py-3"><Badge label={ex.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{ex.score != null ? ex.score : '—'}</td>
                  <td className="px-4 py-3">
                    {ex.status === 'scheduled' && (
                      <Button variant="ghost" size="sm" onClick={() => { setResultModal(ex); setResultForm({ status: 'passed', score: '' }); }}>
                        Въведи резултат
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Нов изпит">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <Input label="ID на студент" value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))} required hint="UUID от таблица students" />
          <div>
            <label className="text-sm font-medium text-gray-700">Тип изпит</label>
            <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Object.entries(EXAM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
            <label className="text-sm font-medium text-gray-700">Резултат</label>
            <select value={resultForm.status} onChange={e => setResultForm(f => ({ ...f, status: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
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
