import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AppLayout from './layouts/AppLayout.jsx';
import UrlForm from './components/UrlForm.jsx';
import UrlResult from './components/UrlResult.jsx';
import StatsOverview from './components/StatsOverview.jsx';
import UrlList from './components/UrlList.jsx';
import { urlsApi } from './services/api.js';

export default function App() {
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ total_links: 0, total_clicks: 0 });
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [list, totals] = await Promise.all([urlsApi.list(), urlsApi.stats()]);
      setLinks(list);
      setStats(totals);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Click counts change when someone opens a link in another tab.
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  async function handleCreate(originalUrl) {
    const link = await urlsApi.create(originalUrl);
    setLatest(link);
    await refresh();
  }

  async function handleDelete(link) {
    if (!window.confirm(`Delete /${link.short_code}? The short link will stop working.`)) return;
    try {
      await urlsApi.remove(link.id);
      if (latest?.id === link.id) setLatest(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Make every link count.</h1>
        <p className="mb-6 mt-2 text-slate-600 dark:text-slate-400">
          Paste a long URL to get a short link you can share, then see how many people clicked it.
        </p>
        <UrlForm onSubmit={handleCreate} />
        <UrlResult link={latest} />
      </section>

      <StatsOverview stats={stats} />

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your links</h2>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </button>
        </div>
        <UrlList links={links} loading={loading} error={error} onDelete={handleDelete} />
      </section>
    </AppLayout>
  );
}
