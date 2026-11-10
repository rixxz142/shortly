import CopyButton from './CopyButton.jsx';

export default function UrlResult({ link }) {
  if (!link) return null;
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center dark:border-indigo-900 dark:bg-indigo-950/40" aria-live="polite">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Your short link</p>
        <a href={link.short_url} target="_blank" rel="noreferrer" className="block truncate font-mono text-lg font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          {link.short_url}
        </a>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{link.original_url}</p>
      </div>
      <CopyButton text={link.short_url} className="bg-indigo-600 text-white hover:bg-indigo-500" />
    </div>
  );
}
