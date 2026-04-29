import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'nexus-theme';
const ACCENT_STORAGE_KEY = 'nexus-accent';
const DEFAULT_THEME_MODE = 'system';
const DEFAULT_ACCENT = '#4F46E5';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeHex = (value) => {
  if (typeof value !== 'string') {
    return DEFAULT_ACCENT;
  }

  const hex = value.trim();
  return /^#([0-9a-f]{6})$/i.test(hex) ? hex.toUpperCase() : DEFAULT_ACCENT;
};

const hexToRgb = (hex) => {
  const sanitized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(sanitized.slice(0, 2), 16),
    g: Number.parseInt(sanitized.slice(2, 4), 16),
    b: Number.parseInt(sanitized.slice(4, 6), 16)
  };
};

const toRgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const darkenHex = (hex, amount = 0.14) => {
  const { r, g, b } = hexToRgb(hex);
  const nextHex = [r, g, b]
    .map((channel) => Math.round(clamp(channel * (1 - amount), 0, 255)))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('');

  return `#${nextHex}`.toUpperCase();
};

const mixHex = (hex, targetHex, ratio) => {
  const source = hexToRgb(hex);
  const target = hexToRgb(targetHex);
  const nextHex = ['r', 'g', 'b']
    .map((channel) => Math.round(clamp(source[channel] + (target[channel] - source[channel]) * ratio, 0, 255)))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('');

  return `#${nextHex}`.toUpperCase();
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_THEME_MODE;
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_MODE;
  });
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_ACCENT;
    }

    return normalizeHex(window.localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT);
  });

  const theme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [theme, themeMode]);

  useEffect(() => {
    const normalizedAccent = normalizeHex(accentColor);
    const nextPrimaryLight = theme === 'dark'
      ? mixHex(normalizedAccent, '#FFFFFF', 0.72)
      : darkenHex(normalizedAccent, 0.14);
    document.documentElement.style.setProperty('--accent', normalizedAccent);
    document.documentElement.style.setProperty('--color-primary', normalizedAccent);
    document.documentElement.style.setProperty('--color-primary-light', nextPrimaryLight);
    document.documentElement.style.setProperty('--color-on-primary', '#FFFFFF');
    document.documentElement.style.setProperty('--accent-soft', toRgba(normalizedAccent, theme === 'dark' ? 0.18 : 0.1));
    document.documentElement.style.setProperty('--accent-hover', theme === 'dark' ? mixHex(normalizedAccent, '#FFFFFF', 0.12) : darkenHex(normalizedAccent));
    window.localStorage.setItem(ACCENT_STORAGE_KEY, normalizedAccent);
  }, [accentColor, theme]);

  const toggleTheme = () => {
    setThemeMode((current) => {
      if (current === 'system') {
        return 'light';
      }

      if (current === 'light') {
        return 'dark';
      }

      return 'system';
    });
  };

  const value = useMemo(() => ({
    theme,
    themeMode,
    systemTheme,
    accentColor,
    setThemeMode,
    setAccentColor: (value) => setAccentColor(normalizeHex(value)),
    toggleTheme
  }), [accentColor, theme, themeMode, systemTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
