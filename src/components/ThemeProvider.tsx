import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialMode());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      window.localStorage.setItem('theme', mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const saved = (() => {
        try { return window.localStorage.getItem('theme'); } catch { return null; }
      })();
      if (saved !== 'light' && saved !== 'dark') {
        setModeState(e.matches ? 'dark' : 'light');
      }
    };
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggleMode = useCallback(() => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}


