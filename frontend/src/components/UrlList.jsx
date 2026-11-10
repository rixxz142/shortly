import { MousePointerClick, Trash2 } from 'lucide-react';
import CopyButton from './CopyButton.jsx';
import { formatDate, formatNumber } from '../services/format.js';

export default function UrlList({ links, loading, error, onDelete }) {
  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Loading links…</p>;
  if (error) return <p role="alert" className="py-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (links.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No links yet. Shorten your first one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {links.map((link) => (
        <li key={link.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <a href={link.short_url} target="_blank" rel="noreferrer" className="font-mono font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              /{link.short_code}
            </a>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400" title={link.original_url}>{link.original_url}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(link.created_at)}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 inline-flex items-center gap-1 text-sm tabular-nums text-slate-600 dark:text-slate-300" title="Clicks">
              <MousePointerClick size={15} aria-hidden="true" />
              {formatNumber(link.clicks)}
              <span className="sr-only">clicks</span>
            </span>
            <CopyButton text={link.short_url} className="text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" />
            <button
              type="button"
              onClick={() => onDelete(link)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label={`Delete /${link.short_code}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
