import { useState } from 'react';

interface SendSparkModalProps {
  open: boolean;
  onClose: () => void;
}

export function SendSparkModal({ open, onClose }: SendSparkModalProps) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(1);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(26,21,18,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '28px 32px',
        width: 480, maxWidth: '90vw', boxShadow: 'var(--shadow-lg)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>⚡ Send a Spark</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>To</label>
            <input
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="@teammate"
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Sparks</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {[1,2,3].map(n => (
                <button key={n} onClick={() => setAmount(n)} style={{
                  width: 40, height: 40, borderRadius: 10, border: `1px solid ${amount === n ? 'var(--spark-deep)' : 'var(--line)'}`,
                  background: amount === n ? 'var(--spark-soft)' : 'var(--surface)',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14, color: amount === n ? 'var(--spark-deep)' : 'var(--muted)',
                }}>{'⚡'.repeat(n)}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What did they do that made a difference?"
              rows={3}
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '10px', background: 'var(--ink)', color: 'var(--spark)',
              border: '1px solid var(--ink)', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <i className="fa-solid fa-paper-plane" /> Send Spark
          </button>
        </div>
      </div>
    </div>
  );
}
