import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-card hover:bg-card-hover text-text-muted hover:text-text transition-all flex items-center justify-center border border-border-subtle shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-primary animate-zoom-in" />
      ) : (
        <Moon className="w-5 h-5 text-primary animate-zoom-in" />
      )}
    </button>
  );
}
