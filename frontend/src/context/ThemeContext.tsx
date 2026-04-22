import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFAIcon } from '../utils/faIconMap';

const DEFAULT_CORAL = '#FF7B6B';
const DEFAULT_TEAL  = '#4ECDC4';
const DEFAULT_EMOJI = '⚡';

interface ThemeColors {
  coral: string;
  teal: string;
  emoji: string;
}

interface ThemeContextValue extends ThemeColors {
  setTheme: (colors: Partial<ThemeColors>) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  coral: DEFAULT_CORAL,
  teal: DEFAULT_TEAL,
  emoji: DEFAULT_EMOJI,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('');
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function buildFaviconSvg(coral: string, teal: string, emoji: string): string {
  const icon = getFAIcon(emoji);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="${teal}"/>
  <rect x="4.5" y="4.5" width="91" height="91" rx="20" fill="${coral}"/>
  <svg x="23" y="23" width="54" height="54" viewBox="${icon.viewBox}">
    <path d="${icon.path}" fill="${teal}"/>
  </svg>
</svg>`;
}

function updateFavicon(coral: string, teal: string, emoji: string) {
  const svg = buildFaviconSvg(coral, teal, emoji);
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"][type="image/svg+xml"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function applyTheme(coral: string, teal: string, emoji = DEFAULT_EMOJI) {
  const root = document.documentElement;
  root.style.setProperty('--coral',        coral);
  root.style.setProperty('--coral-light',  lighten(coral, 0.92));
  root.style.setProperty('--coral-mid',    lighten(coral, 0.55));
  root.style.setProperty('--coral-border', lighten(coral, 0.60));
  root.style.setProperty('--coral-dark',   darken(coral,  0.18));
  root.style.setProperty('--teal',         teal);
  root.style.setProperty('--teal-light',   lighten(teal,  0.92));
  root.style.setProperty('--teal-border',  lighten(teal,  0.60));
  updateFavicon(coral, teal, emoji);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>({
    coral: DEFAULT_CORAL,
    teal: DEFAULT_TEAL,
    emoji: DEFAULT_EMOJI,
  });

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.ok ? r.json() : null)
      .then((data: { colorCoral?: string; colorTeal?: string; emoji?: string } | null) => {
        const coral = data?.colorCoral || DEFAULT_CORAL;
        const teal  = data?.colorTeal  || DEFAULT_TEAL;
        const emoji = data?.emoji      || DEFAULT_EMOJI;
        applyTheme(coral, teal, emoji);
        setColors({ coral, teal, emoji });
      })
      .catch(() => {
        applyTheme(DEFAULT_CORAL, DEFAULT_TEAL, DEFAULT_EMOJI);
      });
  }, []);

  const setTheme = useCallback((patch: Partial<ThemeColors>) => {
    setColors(prev => {
      const next = { ...prev, ...patch };
      applyTheme(next.coral, next.teal, next.emoji);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ ...colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
