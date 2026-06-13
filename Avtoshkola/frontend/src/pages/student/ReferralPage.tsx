import { useEffect, useState } from 'react';
import { referralsApi, MyReferral } from '../../api/referrals.api';
import { Spinner } from '../../components/common/Spinner';

const REWARD = '10% отстъпка';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReferralPage() {
  const [data, setData] = useState<MyReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    referralsApi.getMine()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const link = data ? `${window.location.origin}/register?ref=${data.code}` : '';

  const copy = async (text: string, what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* noop */ }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Запиши се в Автошкола',
          text: `Запиши се с моя код ${data?.code} и двамата получаваме ${REWARD}!`,
          url: link,
        });
      } catch { /* отказано */ }
    } else {
      copy(link, 'link');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Spinner className="h-8 w-8 text-blue-600" /></div>;
  }

  if (!data) {
    return <p className="text-center text-gray-500 py-20">Грешка при зареждане.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Покани приятел</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Сподели кода си — когато приятел се запише, и двамата получавате {REWARD}.
        </p>
      </div>

      {/* Hero card with code */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-7 text-white shadow-lg shadow-purple-600/25">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -left-6 w-36 h-36 bg-white/5 rounded-full" />

        <div className="relative space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="font-semibold text-purple-100">Твоят реферален код</span>
          </div>

          <button
            onClick={() => copy(data.code, 'code')}
            className="w-full flex items-center justify-between gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm
                       border border-white/20 rounded-2xl px-5 py-4 transition-all active:scale-[0.99] group"
          >
            <span className="text-3xl font-black tracking-[0.3em] font-mono">{data.code}</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-100 group-hover:text-white">
              {copied === 'code' ? (
                <>✓ Копирано</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Копирай
                </>
              )}
            </span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={share}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-700 font-bold rounded-xl py-3
                         hover:bg-purple-50 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Сподели
            </button>
            <button
              onClick={() => copy(link, 'link')}
              className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl py-3
                         border border-white/20 transition-all active:scale-95"
            >
              {copied === 'link' ? '✓ Копиран линк' : 'Копирай линк'}
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Как работи</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '📤', title: 'Сподели', text: 'Изпрати кода на приятел' },
            { icon: '✍️', title: 'Запише се', text: 'Той въвежда кода при регистрация' },
            { icon: '🎉', title: 'Печелите', text: `И двамата по ${REWARD}` },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-bold text-gray-900">{s.title}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Invited friends */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Поканени приятели</h3>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
            {data.count} {data.count === 1 ? 'покана' : 'покани'}
          </span>
        </div>

        {data.referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm text-gray-400">Още никой не се е записал с твоя код.</p>
            <p className="text-xs text-gray-400 mt-0.5">Сподели го и започни да печелиш отстъпки!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.referrals.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {r.referred_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.referred_name}</p>
                  <p className="text-xs text-gray-400">{fmtDate(r.created_at)}</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 flex-shrink-0">
                  ✓ Записан
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
