import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { UserSelector } from './UserSelector';
import { ZapMascot } from './ZapMascot';

interface NavItem { to: string; icon: string; label: string; end?: boolean; }
const navItems: NavItem[] = [
  { to: '/', icon: 'fa-solid fa-house', label: 'Home', end: true },
  { to: '/leaderboard', icon: 'fa-solid fa-trophy', label: 'Leaderboard' },
  { to: '/kudos', icon: 'fa-solid fa-bolt', label: 'My Kudos' },
  { to: '/admin', icon: 'fa-solid fa-gear', label: 'Admin' },
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

export function Layout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', minHeight: '100vh' }}>
      <aside style={{
        width: 72, position: 'sticky', top: 0, height: '100vh',
        background: 'var(--coral)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0 16px', gap: 4,
      }}>
        {/* Mascot logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-lg)',
          background: '#FFE8E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.3)',
        }}>
          <ZapMascot size={28} />
        </div>

        {navItems.map(item => <NavButton key={item.to} item={item} />)}

        <div style={{ flex: 1 }} />

        {/* User selector */}
        <UserSelector />
      </aside>

      <main style={{ overflow: 'auto', background: 'var(--bg)' }}>
        <div style={{ padding: '36px 52px 80px', maxWidth: 1300, width: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
