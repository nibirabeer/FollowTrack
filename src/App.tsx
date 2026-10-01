import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SnapshotProvider, useSnapshots } from './contexts/SnapshotContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBanner } from './components/Common/ErrorBanner';
import { useCallback, useState } from 'react';
import { Clock3, House, Plus } from 'lucide-react';

function AppContent() {
  const { error, setError } = useSnapshots();
  const [openImport, setOpenImport] = useState<(() => void) | null>(null);
  const [openHistory, setOpenHistory] = useState<(() => void) | null>(null);
  const registerActions = useCallback((importAction: () => void, historyAction: () => void) => {
    setOpenImport(() => importAction);
    setOpenHistory(() => historyAction);
  }, []);

  return (
    <div className="app-shell min-h-screen text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      <Header />
      <main className="app-main flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        <Dashboard onActionReady={registerActions} />
      </main>
      <nav className="mobile-actionbar pb-safe" aria-label="Quick navigation">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><House size={19} /><span>Home</span></button>
        <button className="mobile-primary" onClick={() => openImport?.()}><Plus size={20} /><span>Import</span></button>
        <button onClick={() => openHistory?.()}><Clock3 size={19} /><span>History</span></button>
      </nav>
      <footer className="app-footer border-t border-gray-200 dark:border-gray-800/80 py-6 text-center text-xs text-gray-400">
        FollowTrack — Safe Instagram Analytics &bull; No passwords &bull; No scraping
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SnapshotProvider>
        <AppContent />
      </SnapshotProvider>
    </ThemeProvider>
  );
}
