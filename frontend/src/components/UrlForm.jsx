import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function UrlForm({ onSubmit }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError('Paste a link to shorten.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(value.trim());
      setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="original-url" className="sr-only">Long URL</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="original-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://example.com/a/very/long/link"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'url-error' : undefined}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
          Shorten
        </button>
      </div>
      {error && (
        <p id="url-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
