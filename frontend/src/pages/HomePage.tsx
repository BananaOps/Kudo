import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { StatCard } from '../components/StatCard';
import { KudoItem } from '../components/KudoItem';
import { SendSparkModal } from '../components/SendSparkModal';
import { useHome } from '../hooks/useHome';
import { useUser } from '../context/UserContext';

const DEFAULT_QUOTA = 5;

export function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const { userId, userName } = useUser();
  const { status, data, error } = useHome(userId);
  const navigate = useNavigate();

  const stats = data?.stats;
  const recentKudos = data?.recentKudos ?? [];
  const topUsers = data?.topUsers ?? [];
  const channelStats = data?.channelStats ?? [];

  const quotaRemaining = stats?.quotaRemaining ?? DEFAULT_QUOTA;
  const quotaTotal = DEFAULT_QUOTA;

  const maxChannelCount = channelStats.length > 0
    ? Math.max(...channelStats.map(c => c.count))
    : 1;

  return (
    <>
      <SendSparkModal open={showModal} onClose={() => setShowModal(false)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span>Kudo</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Home</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', padding: '7px 12px', borderRadius: 'var(--radius-pill)', fontSize: 13 }}>
            <span style={{ color: 'var(--coral)' }}>⚡</span>
            <span>Today</span>
            <span style={{ fontWeight: 600 }}>{quotaRemaining}</span>
            <span style={{ color: 'var(--muted)' }}>/ {quotaTotal}</span>
            <div style={{ width: 54, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(quotaRemaining / quotaTotal) * 100}%`, background: 'var(--coral)', borderRadius: 3 }} />
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: 'var(--coral)', color: '#fff', border: '1px solid var(--coral-dark)', padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)' }}>
            <i className="fa-solid fa-paper-plane" /> Send a Spark
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 52, fontWeight: 800, lineHeight: 1.04, margin: '0 0 16px', color: 'var(--ink)', letterSpacing: '-1.2px' }}>
            Hey{userName ? ` ${userName}` : ''}, your week is <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>charged up.</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: '44ch', marginBottom: 22, lineHeight: 1.6 }}>
            {status === 'success' && stats
              ? `You've received ${stats.receivedThisWeek} sparks this week.`
              : 'Loading your spark activity...'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowModal(true)} style={{ background: 'var(--coral)', color: '#fff', border: '1px solid var(--coral-dark)', padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)' }}>
              <i className="fa-solid fa-bolt" /> Send a Spark
            </button>
            <button
              onClick={() => navigate('/leaderboard?tab=given&period=week')}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}
            >
              See this week's top givers
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--coral)', color: '#fff', borderRadius: 'var(--radius-lg)', padding: '22px 24px', minHeight: 190, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.2) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', fontFamily: 'var(--font-mono)' }}>YOUR DAILY QUOTA</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>{quotaRemaining}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>sparks left to send today</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
              {Array.from({ length: quotaTotal }).map((_, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  background: i < quotaRemaining ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                  border: `1px solid ${i < quotaRemaining ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: i < quotaRemaining ? 'var(--coral)' : 'rgba(255,255,255,0.3)',
                }}>⚡</div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Resets tomorrow</span>
              <button onClick={() => setShowModal(true)} style={{ background: '#fff', color: 'var(--coral)', border: 'none', borderRadius: 'var(--radius)', padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Send now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {status === 'error' && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon="fa-solid fa-bolt" label="Received · This week" value={stats?.receivedThisWeek ?? 0} trendText="+6 vs last week" trendType="up" color="coral" />
        <StatCard icon="fa-solid fa-bolt" label="Received · This month" value={stats?.receivedThisMonth ?? 0} trendText="+18% vs last month" trendType="up" color="teal" />
        <StatCard icon="fa-solid fa-paper-plane" label="Given · This month" value={stats?.givenThisMonth ?? 0} trendText="Across your teammates" color="yellow" />
        <StatCard icon="fa-solid fa-fire" label="Giving streak" value={stats?.streak ?? 0} trendText="Personal best · Keep it going!" highlight color="pink" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Recent sparks</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Kind words coming your way</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 8, padding: 3, gap: 2 }}>
              {(['received', 'given'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', background: tab === t ? 'var(--coral-light)' : 'transparent', color: tab === t ? 'var(--coral-dark)' : 'var(--muted)', fontWeight: tab === t ? 600 : 400 }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            {status === 'loading' && (
              <div style={{ padding: 22, color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>Loading...</div>
            )}
            {status === 'success' && recentKudos.length === 0 && (
              <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No recent sparks yet.</div>
            )}
            {status === 'success' && recentKudos.map((k, i) => (
              <KudoItem key={k.id} kudo={k} variant={tab} index={i} />
            ))}
          </div>
          <div style={{ padding: 16, textAlign: 'center' }}>
            <button
              onClick={() => navigate('/kudos')}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '9px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}
            >
              View all my sparks →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Top of the week</div>
            </div>
            {topUsers.length === 0 && (
              <div style={{ padding: '16px 22px', color: 'var(--muted)', fontSize: 13 }}>No data yet.</div>
            )}
            {topUsers.map((u, i) => (
              <div key={u.userId} style={{ display: 'grid', gridTemplateColumns: '22px 32px 1fr auto', alignItems: 'center', gap: 10, padding: '10px 22px', borderBottom: i < topUsers.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: u.rank === 1 ? 'var(--coral)' : 'var(--muted)', fontWeight: u.rank === 1 ? 700 : 400 }}>{String(u.rank).padStart(2, '0')}</span>
                <Avatar name={u.name} index={i} size={28} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{u.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.kudosCount} ⚡</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Where sparks fly</div>
            </div>
            <div style={{ padding: '8px 22px' }}>
              {channelStats.length === 0 && (
                <div style={{ padding: '8px 0', color: 'var(--muted)', fontSize: 13 }}>No channel data yet.</div>
              )}
              {channelStats.map(ch => {
                const isWeb = ch.name === 'web';
                const label = isWeb ? 'Web' : ch.name;
                const icon = isWeb ? 'fa-solid fa-globe' : 'fa-solid fa-hashtag';
                return (
                  <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(ch.count / maxChannelCount) * 100}%`, background: 'var(--coral)', borderRadius: 2 }} />
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}><i className={icon} style={{ fontSize: 10 }} /> {label}</span>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>{ch.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
