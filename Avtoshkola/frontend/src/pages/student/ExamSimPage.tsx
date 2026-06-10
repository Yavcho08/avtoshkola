import { useEffect, useState } from 'react';
import { examSimApi, ExamQuestion, ExamResult, ExamHistory } from '../../api/exam-sim.api';
import { Spinner } from '../../components/common/Spinner';

type Screen = 'start' | 'quiz' | 'results';

const PASS_SCORE = 7; // 7/10 to pass

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const pass = score >= PASS_SCORE;
  return (
    <div className={`flex flex-col items-center justify-center h-36 w-36 rounded-full border-4 shadow-lg
      ${pass ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
      <span className={`text-4xl font-black ${pass ? 'text-green-600' : 'text-red-600'}`}>{score}/{total}</span>
      <span className={`text-sm font-semibold mt-1 ${pass ? 'text-green-500' : 'text-red-500'}`}>{pct}%</span>
      <span className={`text-xs font-medium mt-0.5 ${pass ? 'text-green-500' : 'text-red-500'}`}>
        {pass ? 'ИЗДЪРЖАН' : 'НЕИЗДЪРЖАН'}
      </span>
    </div>
  );
}

export default function ExamSimPage() {
  const [screen, setScreen] = useState<Screen>('start');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [remaining, setRemaining] = useState(3);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);
  const [showExplanation, setShowExplanation] = useState<number | null>(null);

  useEffect(() => {
    examSimApi.getHistory()
      .then(({ history, remaining }) => { setHistory(history); setRemaining(remaining); })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setError('');
    setGenerating(true);
    try {
      const { questions: qs, remaining: rem } = await examSimApi.generate();
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setRemaining(rem);
      setCurrent(0);
      setShowExplanation(null);
      setScreen('quiz');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Грешка при генериране. Опитай отново.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers(prev => prev.map((a, i) => i === qIdx ? optIdx : a));
  };

  const handleSubmit = async () => {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      setError(`Имаш ${unanswered} неотговорени въпроса.`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await examSimApi.submit(questions, answers as number[]);
      setResult(res);
      setHistory(prev => [{
        id: res.id,
        score: res.score,
        feedback: res.feedback,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setScreen('results');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Грешка при изпращане.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setQuestions([]);
    setAnswers([]);
    setScreen('start');
  };

  const answered = answers.filter(a => a !== null).length;

  // ── START SCREEN ───────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Симулация на изпит</h2>
          <p className="text-sm text-gray-500 mt-0.5">AI генерира уникален тест от 10 въпроса всеки път</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">Готов ли си за изпита?</h3>
            <p className="text-gray-500 text-sm mt-2">10 въпроса · 4 отговора · Нужни са 7/10 за издаване</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Въпроси', value: '10', icon: '📋' },
              { label: 'Нужен резултат', value: '7/10', icon: '🎯' },
              { label: 'Изпита днес', value: `${3 - remaining}/3`, icon: '📅' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={generating || remaining <= 0}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 active:scale-95
                       transition-all duration-150 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Spinner className="h-5 w-5 text-white" /> AI генерира въпросите…</>
            ) : remaining <= 0 ? (
              'Достигнат е дневният лимит'
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Започни изпита
              </>
            )}
          </button>
          {remaining > 0 && <p className="text-xs text-gray-400">Оставащи опити днес: {remaining}</p>}
        </div>

        {/* History */}
        {!loading && history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">История на изпитите</h3>
            <div className="space-y-2">
              {history.map(h => {
                const pass = h.score >= PASS_SCORE;
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.score}/10
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${pass ? 'text-green-600' : 'text-red-600'}`}>
                        {pass ? 'Издържан' : 'Неиздържан'}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{fmtDate(h.created_at)}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${pass ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── QUIZ SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'quiz') {
    const q = questions[current];
    const chosen = answers[current];

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Въпрос {current + 1} от {questions.length}</span>
            <span className="text-sm text-gray-400">{answered}/{questions.length} отговорени</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <p className="text-base font-semibold text-gray-900 leading-snug">{q.question}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(current, i)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.99]
                  ${chosen === i
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
              >
                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold mr-3 flex-shrink-0
                  ${chosen === i ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600
                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Предишен
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold
                         hover:bg-blue-700 active:scale-95 transition-all"
            >
              Следващ →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold
                         hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Spinner className="h-4 w-4 text-white" /> Изчакай…</> : '✓ Предай изпита'}
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all duration-150
                ${i === current
                  ? 'bg-blue-600 text-white shadow-md'
                  : answers[i] !== null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
      </div>
    );
  }

  // ── RESULTS SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'results' && result) {
    const pass = result.score >= PASS_SCORE;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col items-center gap-4">
            <ScoreBadge score={result.score} total={result.total} />
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">
                {pass ? '🎉 Издържа изпита!' : '📚 Не издържа изпита'}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {pass
                  ? 'Браво! Готов си за истинския изпит.'
                  : `Нужни са ${PASS_SCORE}/10. Продължавай да учиш!`}
              </p>
            </div>
          </div>

          {/* AI feedback */}
          <div className={`mt-6 rounded-xl p-4 border text-sm leading-relaxed
            ${pass ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span>{result.feedback}</span>
            </div>
          </div>
        </div>

        {/* Wrong answers review */}
        {result.wrongQuestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">
              Сгрешени въпроси ({result.wrongQuestions.length})
            </h3>
            {result.wrongQuestions.map((q, i) => (
              <div key={i} className="border border-red-100 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="h-5 w-5 rounded bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✗</span>
                    <span className="text-red-600">Твоят отговор: {q.options[q.chosen]}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="h-5 w-5 rounded bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-green-700">Верен: {q.options[q.correct]}</span>
                  </div>
                  <button
                    onClick={() => setShowExplanation(showExplanation === i ? null : i)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    {showExplanation === i ? 'Скрий обяснение ▲' : 'Виж обяснение ▼'}
                  </button>
                  {showExplanation === i && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All correct */}
        {result.wrongQuestions.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center text-green-700 text-sm font-medium">
            🏆 Перфектен резултат — всички 10 отговора са верни!
          </div>
        )}

        <button
          onClick={handleRestart}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
        >
          Нов изпит
        </button>
      </div>
    );
  }

  return null;
}
