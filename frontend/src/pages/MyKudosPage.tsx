import { useMemo, useState } from 'react';
import type { Kudo, KudosStats } from "../types/kudos";
import { useMyKudos } from "../hooks/useMyKudos";
import { useUser } from '../context/UserContext';
import { Avatar } from '../components/Avatar';
import { StatCard } from '../components/StatCard';
import { KudoItem } from '../components/KudoItem';
import { Heatmap } from '../components/Heatmap';

const sk = { background: 'var(--surface-2)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' };

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} aria-label="Loading">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[0,1,2].map(i => <div key={i} style={{ ...sk, height: 100 }} />)}
      </div>
      {[0,1,2].map(i => <div key={i} style={{ ...sk, height: 72 }} />)}
    </div>
  );
}

function StatsGrid({ stats }: { stats: KudosStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
      <StatCard icon="fa-solid fa-bolt" label="Received this week" value={stats.receivedThisWeek} trendType="up" trendText="+2 vs last week" color="coral" />
      <StatCard icon="fa-solid fa-calendar" label="Received this month" value={stats.receivedThisMonth} trendText="Last 30 days" color="teal" />
      <StatCard icon="fa-solid fa-paper-plane" label="Given this week" value={stats.givenThisWeek} trendText="Spread the energy" color="yellow" />
    </div>
  );
}

export function MyKudosPage() {
  const { userId } = useUser();
  const state = useMyKudos(userId);
  const [tab, setTab] = useState<'received' | 'given'>('received');

  const segStyle = (active: boolean) => ({
    padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400,
    background: active ? 'var(--coral-light)' : 'transparent',
    color: active ? 'var(--coral-dark)' : 'var(--muted)',
  });

  const kudos: Kudo[] = state.status === 'success'
    ? (tab === 'received' ? state.data.received : state.data.given ?? [])
    : [];

  const received: Kudo[] = state.status === 'success' ? state.data.received : [];

  const topGivers = useMemo(() => {
    if (!received.length) return [];
    const map = new Map<string, { name: string; count: number }>();
    for (const k of received) {
      const existing = map.get(k.fromUserId) ?? { name: k.fromUserName, count: 0 };
      map.set(k.fromUserId, { ...existing, count: existing.count + k.kudosCount });
    }
    // Exclude names already visible in the current kudos list to avoid duplicates
    const visibleNames = new Set(kudos.map(k => tab === 'received' ? k.fromUserName : k.toUserName));
    return [...map.entries()]
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .filter(g => !visibleNames.has(g.name))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [received, kudos, tab]);

  const wordCloud = useMemo(() => {
    if (!received.length) return [];
    const stopWords = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'pour', 'sur', 'par', 'ton', 'ta', 'tes', 'the', 'a', 'an', 'and', 'for', 'on', 'with', 'your', 'you', 'tu', 'que', 'qui', 'est', 'il', 'elle', 'ce', 'je', 'nous', 'très', 'au', 'aux']);
    const freq = new Map<string, number>();
    for (const k of received) {
      const words = k.message.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
      for (const w of words) {
        freq.set(w, (freq.get(w) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [received]);

  return (
    <>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span>Kudo</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Activity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['received', 'given'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={segStyle(tab === t)}>
                {t === 'received' ? 'Received' : 'Given'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 28 }}>
        <div style={{ width: 84, height: 84, borderRadius: 'var(--radius)', background: 'var(--coral)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 800, flexShrink: 0 }}>A</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 800, lineHeight: 1.06, margin: '0 0 6px', color: 'var(--ink)', letterSpacing: '-0.8px' }}>
            {state.status === 'success'
              ? <>People gave you <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>{state.data.stats.receivedThisMonth} ⚡</em> this month.</>
              : <>My Kudos</>}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>Recognition you've received from your teammates</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--yellow-light)', border: '1px solid var(--yellow-border)', color: 'var(--spark-deep)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>⚡ 412 sparks all time</span>
            <span style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, color: 'var(--muted)' }}>Joined Aug 2024</span>
            <span style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>🔥 12-day giving streak</span>
          </div>
        </div>
        <button style={{ background: 'var(--coral)', color: '#fff', border: '1px solid var(--coral-dark)', padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-bolt" /> Send a Spark
        </button>
      </div>

      {/* Stats */}
      {state.status === "loading" && <Skeleton />}
      {state.status === "error" && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
          {state.message}
        </div>
      )}
      {state.status === "success" && <StatsGrid stats={state.data.stats} />}

      {/* Heatmap */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Your year in sparks</div>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <Heatmap />
        </div>
      </div>

      {/* Main 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        {/* Left: kudos list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Detailed kudos</div>
          </div>
          {state.status === "loading" && (
            <div style={{ padding: 22 }}>
              {[0,1,2].map(i => <div key={i} style={{ ...sk, height: 72, marginBottom: 12 }} />)}
            </div>
          )}
          {state.status === "success" && kudos.length === 0 && (
            <div style={{ padding: '48px 22px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              No kudos received yet — keep up the great work! 🌱
            </div>
          )}
          {state.status === "success" && kudos.length > 0 && (
            <>
              {kudos.map((k, i) => <KudoItem key={k.id} kudo={k} variant={tab} index={i} />)}
              <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid var(--line)' }}>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Load more</button>
              </div>
            </>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Who's cheered you on */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Who's cheered you on</div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {topGivers.length === 0 && (
                <div style={{ padding: '12px 22px', color: 'var(--muted)', fontSize: 13 }}>No data yet.</div>
              )}
              {topGivers.map((g, i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderBottom: i < topGivers.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <Avatar name={g.name} index={i} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{g.name}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{g.count} ⚡</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word cloud */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Words that keep showing up</div>
            </div>
            <div style={{ padding: '16px 22px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {wordCloud.length === 0 && (
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>No keywords yet.</span>
              )}
              {wordCloud.map((w, idx) => {
                const palette = [
                  { bg: 'var(--coral-light)',  border: 'var(--coral-border)',  text: 'var(--coral-dark)' },
                  { bg: 'var(--teal-light)',   border: 'var(--teal-border)',   text: 'var(--teal)' },
                  { bg: 'var(--yellow-light)', border: 'var(--yellow-border)', text: '#C89300' },
                  { bg: 'var(--pink-light)',   border: 'var(--pink-border)',   text: 'var(--pink)' },
                  { bg: 'var(--sky-light)',    border: 'var(--sky-border)',    text: 'var(--sky)' },
                ];
                const c = idx < 5 ? palette[idx] : { bg: 'var(--surface-2)', border: 'var(--line)', text: 'var(--ink-2)' };
                const isTop = idx < 5;
                return (
                  <span key={w.word} style={{
                    fontSize: Math.max(11, Math.min(20, 11 + w.count * 2)),
                    padding: isTop ? '5px 12px' : '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    fontWeight: isTop ? 700 : 400,
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1,
                  }}>
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Mock data (dev / Storybook) ───────────────────────────────────────────────

export const MOCK_MY_KUDOS_RESPONSE = {
  stats: {
    receivedThisWeek: 7,
    receivedThisMonth: 23,
    givenThisWeek: 3,
    givenThisMonth: 12,
  },
  received: [
    {
      id: "k1",
      fromUserId: "UBOB0001",
      fromUserName: "Bob Dupont",
      fromAvatarUrl: "https://i.pravatar.cc/150?u=bob",
      toUserId: "UALICE01",
      toUserName: "Alice Martin",
      toAvatarUrl: "https://i.pravatar.cc/150?u=alice",
      kudosCount: 2,
      message: "Fantastic job on the release, you saved the day!",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "k2",
      fromUserId: "UCAROL01",
      fromUserName: "Carol Petit",
      fromAvatarUrl: "https://i.pravatar.cc/150?u=carol",
      toUserId: "UALICE01",
      toUserName: "Alice Martin",
      toAvatarUrl: "https://i.pravatar.cc/150?u=alice",
      kudosCount: 1,
      message: "Thanks for the detailed code review.",
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ],
  given: [],
} satisfies import("../types/kudos").MyKudosResponse;
