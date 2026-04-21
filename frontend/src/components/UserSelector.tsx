import { useState, useRef, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useUser } from '../context/UserContext';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS: [string, string][] = [
  ['#F5B800', '#1F1F35'],
  ['#7C6FFF', '#fff'],
  ['#00C9A7', '#fff'],
  ['#FF6B6B', '#fff'],
  ['#4ECDC4', '#1F1F35'],
];

function avatarColor(name: string): [string, string] {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function UserSelector() {
  const [open, setOpen] = useState(false);
  const { users } = useUsers();
  const { userId, userName, setUser } = useUser();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = userName || 'Choisir…';
  const [bg, fg] = userName ? avatarColor(userName) : ['var(--surface-2)', 'var(--muted)'];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={displayName}
        aria-label="Changer d'utilisateur"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: bg, color: fg, fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-sans)', border: 'none',
          boxShadow: open
            ? '0 0 0 2px var(--spark), 0 2px 8px rgba(31,31,53,0.18)'
            : '0 0 0 2px var(--line)',
          cursor: 'pointer', flexShrink: 0,
          transition: 'box-shadow 0.12s',
        }}
      >
        {userName ? initials(userName) : <i className="fa-solid fa-user" style={{ fontSize: 13 }} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 48, bottom: 0,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 12, padding: '6px 0',
          minWidth: 200, boxShadow: '0 8px 24px rgba(31,31,53,0.14)',
          zIndex: 200,
        }}>
          <div style={{
            padding: '6px 14px 8px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--muted)', fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase', borderBottom: '1px solid var(--line)',
            marginBottom: 4,
          }}>Qui êtes-vous ?</div>

          {users.length === 0 && (
            <div style={{ padding: '8px 14px', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
              Aucun utilisateur trouvé
            </div>
          )}

          {users.map((u) => {
            const isSelected = u.userId === userId;
            const [ubg, ufg] = avatarColor(u.name);
            return (
              <button
                key={u.userId}
                onClick={() => { setUser(u.userId, u.name); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 14px', border: 'none', background: isSelected ? 'var(--spark-soft)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: ubg, color: ufg, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {initials(u.name)}
                </div>
                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: 'var(--ink)' }}>
                  {u.name}
                </span>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--spark-deep)' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
