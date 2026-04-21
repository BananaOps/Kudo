import { useState } from 'react';
import type { LeaderboardEntry } from "../types/kudos";
import { Avatar } from '../components/Avatar';
import { SparklineTrend } from '../components/SparklineTrend';
import { useLeaderboard } from '../hooks/useLeaderboard';

type Period = 'week' | 'month' | 'all';
type Tab = 'received' | 'given';

const POD_STYLES: Record<number, { bg: string; border: string; rib: string; halo?: string }> = {
  1: {
    bg: 'var(--yellow-light)',
    border: 'var(--yellow-border)',
    rib: 'var(--yellow)',
    halo: 'radial-gradient(circle, rgba(245,184,0,0.2) 0%, transparent 65%)',
  },
  2: { bg: 'var(--sky-light)', border: 'var(--sky-border)', rib: 'var(--sky)' },
  3: { bg: 'var(--teal-light)', border: 'var(--teal-border)', rib: 'var(--teal)' },
};

const POD_ORDER = [2, 1, 3];

function PodiumCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const pod = POD_STYLES[entry.rank] ?? POD_STYLES[3];
  const isGold = entry.rank === 1;
  const labels: Record<number, string> = { 1: '01 · Top spark', 2: '02 · Runner-up', 3: '03 · Rising star' };
  return (
    <div style={{
      background: pod.bg, border: `1px solid ${pod.border}`,
      borderRadius: 'var(--radius-lg)', padding: `${isGold ? 36 : 28}px 22px 28px`,
      textAlign: 'center', position: 'relative', alignSelf: 'flex-end',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{
        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
        background: pod.rib, border: `1px solid ${isGold ? 'var(--spark-deep)' : 'var(--line)'}`,
        borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600,
        color: isGold ? 'var(--ink)' : 'var(--muted)', fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
      }}>
        {labels[entry.rank]}
      </div>
      {isGold && pod.halo && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)', background: pod.halo, pointerEvents: 'none' }} />
      )}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <Avatar name={entry.name} index={index} size={isGold ? 84 : 68} />
        <span style={{
          position: 'absolute', top: -6, right: isGold ? 'calc(50% - 54px)' : 'calc(50% - 46px)',
          fontSize: 18,
        }} aria-label={`Rank ${entry.rank}`}>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 2 }}>{entry.name}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Engineer</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: isGold ? 56 : 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>{entry.kudosCount}</span>
        <span style={{ fontSize: isGold ? 18 : 15, color: 'var(--spark-deep)' }}>⚡</span>
      </div>
    </div>
  );
}

function TableRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 1fr 140px 160px',
      alignItems: 'center', borderTop: '1px solid var(--line)',
      padding: '12px 20px', background: 'var(--surface)',
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'; }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: entry.rank <= 3 ? 'var(--coral)' : 'var(--muted)',
        fontWeight: entry.rank <= 3 ? 700 : 400,
      }}>
        {String(entry.rank).padStart(2, '0')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={entry.name} index={index} size={40} />
        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{entry.name}</div>
      </div>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.kudosCount} ⚡</span>
      <SparklineTrend data={[]} />
    </div>
  );
}

export interface LeaderboardPageProps {
  entries?: LeaderboardEntry[];
}

const PERIOD_LABELS: Record<Period, string> = { week: 'Cette semaine', month: 'Ce mois', all: 'Tout le temps' };
const TAB_LABELS: Record<Tab, string> = { received: '⚡ Reçus', given: '🎁 Donnés' };

const PERIOD_TITLE: Record<Period, string> = {
  week:  'cette semaine',
  month: 'ce mois',
  all:   'de tous les temps',
};
const TAB_TITLE: Record<Tab, { adjective: string }> = {
  received: { adjective: 'appréciées' },
  given:    { adjective: 'généreuses' },
};

export function LeaderboardPage({ entries: entriesProp }: LeaderboardPageProps = {}) {
  const [period, setPeriodState] = useState<Period>('week');
  const [tab, setTabState] = useState<Tab>('received');
  const { data, status, error, setPeriod, setTab } = useLeaderboard('week', 'received');

  const entries = entriesProp !== undefined ? entriesProp : (data?.entries ?? []);

  const handlePeriod = (p: Period) => { setPeriodState(p); setPeriod(p); };
  const handleTab   = (t: Tab)    => { setTabState(t);   setTab(t); };

  const isLoading = entriesProp === undefined && status === 'loading';
  const isError   = entriesProp === undefined && status === 'error';

  const sorted        = [...entries].sort((a, b) => a.rank - b.rank);
  const topThree      = sorted.filter(e => e.rank <= 3);
  const rest          = sorted.filter(e => e.rank > 3);
  const podiumOrdered = POD_ORDER
    .map(r => topThree.find(e => e.rank === r))
    .filter(Boolean) as LeaderboardEntry[];

  const segStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400,
    background: active ? 'var(--coral)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    transition: 'all 0.15s',
  });

  const tabInfo = TAB_TITLE[tab];

  return (
    <>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span>Kudo</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Leaderboard</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          {PERIOD_LABELS[period]} · {new Date().toLocaleDateString('fr-FR')}
        </span>
      </div>

      {/* Header dynamique */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 42, fontWeight: 800, lineHeight: 1.06, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-1px' }}>
          Les personnes les plus{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--spark-deep)' }}>{tabInfo.adjective}</em>{' '}
          {PERIOD_TITLE[period]}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {tab === 'received'
            ? 'Célébrons ceux qui ont été reconnus par leurs collègues.'
            : 'Célébrons ceux qui ont le plus contribué à la culture de reconnaissance.'}
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p} onClick={() => handlePeriod(p)} style={segStyle(period === p)}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button key={t} onClick={() => handleTab(t)} style={segStyle(tab === t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
          Chargement du leaderboard…
        </div>
      )}
      {isError && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '64px 32px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Aucun kudo {tab === 'received' ? 'reçu' : 'donné'} {PERIOD_TITLE[period]} — No kudos given yet 🎉
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <>
          {topThree.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 16, alignItems: 'flex-end', marginBottom: 32 }}>
              {podiumOrdered.map((entry) => (
                <PodiumCard key={entry.userId} entry={entry} index={sorted.indexOf(entry)} />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px 160px', padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                {['Rang', 'Collègue', 'Sparks', 'Tendance 7j'].map(col => (
                  <span key={col} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', fontWeight: 500 }}>{col}</span>
                ))}
              </div>
              {rest.map((entry, i) => (
                <TableRow key={entry.userId} entry={entry} index={i + 3} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Mock data (used by tests) ─────────────────────────────────────────────────
export const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'U001', name: 'Alice Martin', kudosCount: 42 },
  { rank: 2, userId: 'U002', name: 'Bob Dupont', kudosCount: 35 },
  { rank: 3, userId: 'U003', name: 'Carol Petit', kudosCount: 28 },
  { rank: 4, userId: 'U004', name: 'David Leroy', kudosCount: 19 },
  { rank: 5, userId: 'U005', name: 'Eva Bernard', kudosCount: 11 },
];
