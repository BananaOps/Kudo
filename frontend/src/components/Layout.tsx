import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getFAIcon } from '../utils/faIconMap';

// ── App icon (inline SVG, colours driven by theme) ────────────────────────────

function AppIcon() {
  const { emoji } = useTheme();
  const icon = getFAIcon(emoji);
  return (
    <svg
      viewBox="0 0 100 100"
      width="44"
      height="44"
      style={{ display: 'block', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" style={{ fill: 'var(--teal)' }} />
      <rect x="4.5" y="4.5" width="91" height="91" rx="20" style={{ fill: 'var(--coral)' }} />
      <svg x="23" y="23" width="54" height="54" viewBox={icon.viewBox}>
        <path d={icon.path} style={{ fill: 'var(--teal)' }} />
      </svg>
    </svg>
  );
}

interface NavItem { to: string; icon: string; label: string; end?: boolean; }

const ALL_NAV: NavItem[] = [
  { to: '/', icon: 'fa-solid fa-house', label: 'Home', end: true },
  { to: '/leaderboard', icon: 'fa-solid fa-trophy', label: 'Leaderboard' },
  { to: '/kudos', icon: 'fa-solid fa-bolt', label: 'My Kudos' },
  { to: '/challenges', icon: 'fa-solid fa-flag-checkered', label: 'Challenges' },
  { to: '/admin', icon: 'fa-solid fa-gear', label: 'Admin' },
];

const PUBLIC_NAV: NavItem[] = [
  { to: '/leaderboard', icon: 'fa-solid fa-trophy', label: 'Leaderboard' },
];

function NavButton({ item }: { item: NavItem }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      style={{ position: 'relative', textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive
              ? 'rgba(255,255,255,0.25)'
              : hovered ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: isActive ? '#fff' : hovered ? '#fff' : 'rgba(255,255,255,0.7)',
            fontSize: 15, cursor: 'pointer',
            transition: 'background 0.12s, color 0.12s',
          }}>
            <i className={item.icon} />
          </div>
          {hovered && (
            <div style={{
              position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--ink)', color: '#fff', fontSize: 12,
              fontFamily: 'var(--font-sans)', fontWeight: 500,
              padding: '5px 11px', borderRadius: 4, whiteSpace: 'nowrap',
              zIndex: 100, pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(31,31,46,0.2)',
            }}>{item.label}</div>
          )}
        </>
      )}
    </NavLink>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function SlackConnectButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="/auth/slack"
      title="Se connecter avec Slack"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36, height: 36, borderRadius: 'var(--radius-sm)',
        background: hovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.35)',
        cursor: 'pointer', flexShrink: 0, textDecoration: 'none',
        transition: 'background 0.12s',
        position: 'relative',
      }}
    >
      <i className="fa-brands fa-slack" style={{ fontSize: 18, color: '#fff' }} />
      {hovered && (
        <div style={{
          position: 'absolute', left: 48, bottom: 0,
          background: 'var(--ink)', color: '#fff', fontSize: 11,
          fontFamily: 'var(--font-sans)', fontWeight: 500,
          padding: '5px 10px', borderRadius: 4, whiteSpace: 'nowrap',
          zIndex: 200, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(31,31,46,0.2)',
        }}>Se connecter avec Slack</div>
      )}
    </a>
  );
}

function UserAvatar() {
  const { userName, logout } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/leaderboard');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={userName}
        style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-sans)', border: '1px solid rgba(255,255,255,0.35)',
          cursor: 'pointer', flexShrink: 0,
          boxShadow: open ? '0 0 0 2px rgba(255,255,255,0.5)' : 'none',
          transition: 'box-shadow 0.12s',
        }}
      >
        {initials(userName)}
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 48, bottom: 0,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', padding: '6px 0',
          minWidth: 180, boxShadow: '0 8px 24px rgba(31,31,53,0.14)',
          zIndex: 200,
        }}>
          <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Connecté via Slack</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 13, color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ fontSize: 12, color: 'var(--muted)' }} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { isAuthenticated, isAdmin, authStatus } = useUser();
  const navItems = isAuthenticated
    ? ALL_NAV.filter(item => item.to !== '/admin' || isAdmin)
    : PUBLIC_NAV;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', minHeight: '100vh' }}>
      <aside style={{
        width: 72, position: 'sticky', top: 0, height: '100vh',
        background: 'var(--coral)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0 16px', gap: 4,
      }}>
        {/* App logo */}
        <div style={{ marginBottom: 16 }}>
          <AppIcon />
        </div>

        {navItems.map(item => <NavButton key={item.to} item={item} />)}

        <div style={{ flex: 1 }} />

        {/* Bottom: Slack connect button or authenticated user avatar */}
        {authStatus !== 'loading' && (
          isAuthenticated ? <UserAvatar /> : <SlackConnectButton />
        )}
      </aside>

      <main style={{ overflow: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ padding: '36px 52px 80px', maxWidth: 1300, width: '100%', flex: 1 }}>
          <Outlet />
        </div>
        <footer style={{
          borderTop: '1px solid var(--line)',
          padding: '12px 52px',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)',
        }}>
          <span>Made with</span>
          <span style={{ fontSize: 14 }}>🍌</span>
          <span>by</span>
          <a
            href="https://github.com/BananaOps"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--coral)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
          >
            <i className="fa-brands fa-github" style={{ fontSize: 14 }} />
            BananaOps
          </a>
          <span style={{ marginLeft: 4, color: 'var(--line-strong)' }}>·</span>
          <a
            href="https://github.com/BananaOps/kudo"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
          >
            <i className="fa-brands fa-github" style={{ fontSize: 12 }} />
            kudo
          </a>
          <span style={{ color: 'var(--line-strong)' }}>·</span>
          <a
            href="https://github.com/BananaOps/kudo/stargazers"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--yellow)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
          >
            <i className="fa-regular fa-star" style={{ fontSize: 12 }} />
            Star
          </a>
          <span style={{ color: 'var(--line-strong)' }}>·</span>
          <a
            href="https://github.com/BananaOps/kudo/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
          >
            <i className="fa-regular fa-circle-dot" style={{ fontSize: 12 }} />
            Issues
          </a>
          <span style={{ color: 'var(--line-strong)' }}>·</span>
          <a
            href="https://github.com/BananaOps/kudo/discussions"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
          >
            <i className="fa-regular fa-comments" style={{ fontSize: 12 }} />
            Discussions
          </a>
        </footer>
      </main>
    </div>
  );
}
