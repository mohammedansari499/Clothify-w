import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Initial theme check: localStorage (user preference) > system preference > default to dark
    const saved = localStorage.getItem('clothify_theme');
    if (saved) return saved;
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    return system;
  });

  useEffect(() => {
    // Sync theme with document attributes for Tailwind and styling
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('clothify_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
