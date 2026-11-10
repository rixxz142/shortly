import Header from '../components/Header.jsx';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:pt-12">{children}</main>
      <footer className="pb-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Shortly — make every link count.
      </footer>
    </div>
  );
}
