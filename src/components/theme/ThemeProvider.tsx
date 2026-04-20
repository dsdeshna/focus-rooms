'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, getDarkMode, toggleDarkMode } from '@/lib/themes/ThemeStrategy';

interface ThemeContextValue {
  currentTheme: string;
  isDark: boolean;
  setTheme: (key: string) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: 'lavender-dream',
  isDark: false,
  setTheme: () => {},
  toggleDark: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('lavender-dream');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = getStoredTheme();
    const dark  = getDarkMode();
    setCurrentTheme(saved);
    setIsDark(dark);
    applyTheme(saved, dark);
  }, []);

  const setTheme = (key: string) => {
    setCurrentTheme(key);
    applyTheme(key, isDark);
  };

  const toggleDark = () => {
    const newDark = toggleDarkMode();
    setIsDark(newDark);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, isDark, setTheme, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}