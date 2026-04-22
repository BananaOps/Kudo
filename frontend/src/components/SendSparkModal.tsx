import { useState, useRef, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useUser } from '../context/UserContext';
import { Avatar } from './Avatar';

interface SendResult { error?: string; }

async function sendKudo(payload: {
  toUserId: string; toUserName: string;
  fromUserName: string;
  message: string; emojiCount: number;
}): Promise<SendResult> {
  const res = await fetch('/api/kudos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_user_id: payload.toUserId,
      to_user_name: payload.toUserName,
      from_user_name: payload.fromUserName,
      message: payload.message,
      emoji_count: payload.emojiCount,
    }),
  });
  if (res.ok) return {};
  const data = await res.json().catch(() => ({}));
  return { error: (data as { error?: string }).error ?? `Erreur ${res.status}` };
}

interface SendSparkModalProps {
  open: boolean;
  onClose: () => void;
}

export function SendSparkModal({ open, onClose }: SendSparkModalProps) {
  const { users } = useUsers();
  const { userId: currentUserId, userName: currentUserName } = useUser();

  const [toUserId, setToUserId] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [messageFocused, setMessageFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const candidates = users.filter(
    u => u.userId !== currentUserId &&
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => u.userId === toUserId);
  const selectedIndex = users.findIndex(u => u.userId === toUserId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setToUserId('');
      setMessage('');
      setAmount(1);
      setSearch('');
      setDropdownOpen(false);
      setSubmitError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const result = await sendKudo({
      toUserId,
      toUserName: selectedUser?.name ?? '',
      fromUserName: currentUserName,
      message,
      emojiCount: amount,
    });
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  const canSubmit = toUserId && message.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(31,31,46,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: 460, maxWidth: '92vw',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'var(--coral)', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>
              Send a Spark
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
              color: '#fff', width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* To — user dropdown */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}>
              To
            </label>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  border: `1px solid ${dropdownOpen ? 'var(--coral)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  boxShadow: dropdownOpen ? '0 0 0 3px var(--coral-border)' : 'none',
                  transition: 'border-color 0.12s, box-shadow 0.12s',
                  textAlign: 'left',
                }}
              >
                {selectedUser ? (
                  <>
                    <Avatar name={selectedUser.name} index={selectedIndex} size={24} />
                    <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{selectedUser.name}</span>
                  </>
                ) : (
                  <>
                    <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-user" style={{ fontSize: 11, color: 'var(--muted-2)' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--muted-2)' }}>Choose a teammate…</span>
                  </>
                )}
                <i className="fa-solid fa-chevron-down" style={{
                  marginLeft: 'auto', fontSize: 11, color: 'var(--muted)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                }}>
                  {/* Search */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--muted)' }} />
                      <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        style={{
                          border: 'none', background: 'transparent', outline: 'none',
                          fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--ink)',
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>
                  {/* List */}
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {candidates.length === 0 && (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--muted)' }}>No match</div>
                    )}
                    {candidates.map((u) => {
                      const isSelected = u.userId === toUserId;
                      const idx = users.findIndex(x => x.userId === u.userId);
                      return (
                        <button
                          key={u.userId}
                          onClick={() => { setToUserId(u.userId); setDropdownOpen(false); setSearch(''); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px', border: 'none',
                            background: isSelected ? 'var(--coral-light)' : 'transparent',
                            cursor: 'pointer', fontFamily: 'var(--font-sans)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <Avatar name={u.name} index={idx} size={28} />
                          <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: 'var(--ink)' }}>{u.name}</span>
                          {isSelected && (
                            <i className="fa-solid fa-check" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--coral)' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sparks amount */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}>
              Sparks
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${amount === n ? 'var(--coral)' : 'var(--line)'}`,
                    background: amount === n ? 'var(--coral-light)' : 'var(--surface)',
                    color: amount === n ? 'var(--coral-dark)' : 'var(--muted)',
                    fontWeight: amount === n ? 700 : 400,
                    cursor: 'pointer', fontSize: 15,
                    boxShadow: amount === n ? '0 0 0 3px var(--coral-border)' : 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  {'⚡'.repeat(n)}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onFocus={() => setMessageFocused(true)}
              onBlur={() => setMessageFocused(false)}
              placeholder="What did they do that made a difference?"
              rows={3}
              style={{
                display: 'block', width: '100%', padding: '10px 12px',
                border: `1px solid ${messageFocused ? 'var(--coral)' : 'var(--line)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)',
                background: 'var(--surface)', outline: 'none', resize: 'vertical',
                boxShadow: messageFocused ? '0 0 0 3px var(--coral-border)' : 'none',
                transition: 'border-color 0.12s, box-shadow 0.12s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error */}
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px',
                background: 'var(--surface)', color: 'var(--ink)',
                border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              style={{
                flex: 2, padding: '10px',
                background: canSubmit && !submitting ? 'var(--coral)' : 'var(--surface-2)',
                color: canSubmit && !submitting ? '#fff' : 'var(--muted-2)',
                border: `1px solid ${canSubmit && !submitting ? 'var(--coral-dark)' : 'var(--line)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: 600,
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              {submitting
                ? <><i className="fa-solid fa-spinner fa-spin" /> Sending…</>
                : <><i className="fa-solid fa-paper-plane" /> Send Spark</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
