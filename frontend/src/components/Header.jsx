import { Link2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../services/theme.jsx';

export default function Header() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Link2 size={18} aria-hidden="true" />
          </span>
          Shortly
        </a>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
