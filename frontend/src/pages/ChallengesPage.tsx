import { useState } from 'react';
import type { Challenge } from '../types/kudos';
import { useChallenges } from '../hooks/useChallenges';

// ── Claim modal ───────────────────────────────────────────────────────────────

function ClaimModal({
  challenge,
  onClose,
  onSuccess,
}: {
  challenge: Challenge;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(31,31,46,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 60px rgba(31,31,46,0.2)',
        width: '100%', maxWidth: 480, padding: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
              Submit completion
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{challenge.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ background: 'var(--yellow-light)', border: '1px solid var(--yellow-border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C89300' }}>Reward: {challenge.kudoReward} spark{challenge.kudoReward !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Awarded once an admin validates your request</div>
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
            Note <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional — describe how you completed it)</span>
          </span>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. I deployed the feature to production on April 20th…"
            rows={4}
            style={{
              width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--line)',
              padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-sans)',
              background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </label>

        {error && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--coral-dark)', background: 'var(--coral)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {submitting && <i className="fa-solid fa-spinner fa-spin" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Challenge card ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
  pending:  { bg: 'var(--yellow-light)', border: 'var(--yellow-border)', text: '#C89300',        label: 'Pending review', icon: 'fa-solid fa-clock' },
  approved: { bg: 'var(--teal-light)',   border: 'var(--teal-border)',   text: 'var(--teal)',     label: 'Approved',       icon: 'fa-solid fa-check-circle' },
  rejected: { bg: '#FEF2F2',             border: '#FCA5A5',              text: '#DC2626',          label: 'Rejected',       icon: 'fa-solid fa-times-circle' },
};

function ChallengeCard({ challenge, onClaim }: { challenge: Challenge; onClaim: (c: Challenge) => void }) {
  const expiresAt = challenge.expiresAt ? new Date(challenge.expiresAt) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
  const badgeInfo = challenge.userStatus ? STATUS_BADGE[challenge.userStatus] : null;
  const canClaim = !challenge.userStatus;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      {/* Header with reward */}
      <div style={{
        background: 'var(--coral)', padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-trophy" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
            Challenge
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 10px' }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-sans)' }}>{challenge.kudoReward}</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>spark{challenge.kudoReward !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>
          {challenge.title}
        </h3>
        {challenge.description && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{challenge.description}</p>
        )}

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {daysLeft !== null && (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
              background: daysLeft <= 3 ? '#FEF2F2' : 'var(--surface-2)',
              border: `1px solid ${daysLeft <= 3 ? '#FCA5A5' : 'var(--line)'}`,
              color: daysLeft <= 3 ? '#DC2626' : 'var(--muted)',
              fontWeight: 500,
            }}>
              <i className="fa-solid fa-clock" style={{ marginRight: 4 }} />
              {daysLeft > 0 ? `${daysLeft}d left` : 'Expires today'}
            </span>
          )}
          {badgeInfo && (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
              background: badgeInfo.bg, border: `1px solid ${badgeInfo.border}`, color: badgeInfo.text, fontWeight: 600,
            }}>
              <i className={badgeInfo.icon} style={{ marginRight: 4 }} />
              {badgeInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
        {canClaim ? (
          <button
            onClick={() => onClaim(challenge)}
            style={{
              width: '100%', background: 'var(--coral)', color: '#fff',
              border: '1px solid var(--coral-dark)', borderRadius: 'var(--radius)',
              padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <i className="fa-solid fa-flag-checkered" /> I completed this
          </button>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '4px 0' }}>
            {challenge.userStatus === 'approved' ? '🎉 Sparks have been awarded!' : 'Your request has been submitted.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ChallengesPage() {
  const { status, reload, ...rest } = useChallenges();
  const challenges = status === 'success' ? (rest as { challenges: Challenge[] }).challenges : [];
  const errorMsg   = status === 'error'   ? (rest as { message: string }).message : '';

  const [claimTarget, setClaimTarget] = useState<Challenge | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleSuccess = () => {
    setClaimTarget(null);
    setSuccessId(claimTarget?.id ?? null);
    reload();
  };

  return (
    <>
      {claimTarget && (
        <ClaimModal
          challenge={claimTarget}
          onClose={() => setClaimTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span>Kudo</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Challenges</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 42, fontWeight: 800, lineHeight: 1.06, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-1px' }}>
          Earn more <em style={{ color: 'var(--coral)', fontStyle: 'italic' }}>sparks</em> by taking on challenges
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Complete a challenge and submit your request — an admin will validate and award your sparks.
        </p>
      </div>

      {successId && (
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 'var(--radius)', padding: '12px 18px', fontSize: 14, color: 'var(--teal)', fontWeight: 500, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-check-circle" />
          Your completion request has been submitted! An admin will review it soon.
          <button onClick={() => setSuccessId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 16 }}>✕</button>
        </div>
      )}

      {status === 'loading' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 260, background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 14, color: '#DC2626' }}>
          {errorMsg}
        </div>
      )}

      {status === 'success' && challenges.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '64px 32px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          No active challenges right now — check back soon!
        </div>
      )}

      {status === 'success' && challenges.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {challenges.map(c => (
            <ChallengeCard key={c.id} challenge={c} onClaim={setClaimTarget} />
          ))}
        </div>
      )}
    </>
  );
}
