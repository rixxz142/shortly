import { formatNumber } from '../services/format.js';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}

export default function StatsOverview({ stats }) {
  return (
    <section aria-label="Overview" className="grid grid-cols-2 gap-3">
      <Stat label="Total links" value={stats.total_links} />
      <Stat label="Total clicks" value={stats.total_clicks} />
    </section>
  );
}
