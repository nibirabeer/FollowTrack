import { useEffect, useRef, useState } from 'react';
import { Plus, FolderArchive } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { CategoryTabs } from './CategoryTabs';
import { SnapshotCompare } from '../Snapshots/SnapshotCompare';
import { SnapshotImport } from '../Snapshots/SnapshotImport';
import { SnapshotList } from '../Snapshots/SnapshotList';
import { UserList } from '../UserList/UserList';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { LoadingState } from '../Common/LoadingState';
import { ExportWalkthrough } from './ExportWalkthrough';
import { ExportLibrary } from './ExportLibrary';
import { loadExportArchive } from '../../lib/exportArchiveStorage';
import { InstagramExportArchive } from '../../types/exportArchive';

export function Dashboard({ onActionReady }: { onActionReady?: (openImport: () => void, openHistory: () => void) => void }) {
  const {
    snapshots,
    currentComparison,
    selectedCategory,
    isLoading,
  } = useSnapshots();

  const [showImport, setShowImport] = useState(false);
  const [showSnapshotsList, setShowSnapshotsList] = useState(false);
  const [exportArchive, setExportArchive] = useState<InstagramExportArchive | null>(null);
  const importPanelRef = useRef<HTMLDivElement>(null);

  const latestArchiveSnapshot = [...snapshots]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .find((snapshot) => snapshot.hasExtendedData);
  const latestArchiveId = latestArchiveSnapshot?.id || null;

  useEffect(() => {
    onActionReady?.(() => setShowImport(true), () => setShowSnapshotsList(true));
  }, [onActionReady]);

  useEffect(() => {
    if (!showImport) return;
    importPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showImport]);

  useEffect(() => {
    let isCurrent = true;
    if (!latestArchiveId) {
      setExportArchive(null);
      return () => { isCurrent = false; };
    }

    setExportArchive(null);
    void loadExportArchive(latestArchiveId)
      .then((archive) => { if (isCurrent) setExportArchive(archive); })
      .catch(() => { if (isCurrent) setExportArchive(null); });
    return () => { isCurrent = false; };
  }, [latestArchiveId]);

  if (isLoading) {
    return <LoadingState />;
  }

  const selectedUsers =
    currentComparison && selectedCategory ? currentComparison[selectedCategory] : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="dashboard-intro">
        <div>
          <div className="dashboard-eyebrow"><span className="status-orb" /> PRIVATE FOLLOWER INSIGHTS</div>
          <h1 className="dashboard-title text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Follower Analytics
          </h1>
          <p className="dashboard-subtitle text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            A clearer picture of your Instagram connections, built from your own data export.
          </p>
        </div>

        <div className="dashboard-actions flex items-center gap-2">
          <button
            onClick={() => setShowSnapshotsList(!showSnapshotsList)}
              className="button-glass flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow-2xs"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Manage Snapshots</span>
          </button>

          <button
            onClick={() => setShowImport(!showImport)}
              className="dashboard-import-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Import Snapshot</span>
          </button>
        </div>
      </div>

      {/* Snapshot Import Drawer/Modal */}
      {showImport && (
        <div ref={importPanelRef} className="import-panel-anchor mb-6">
          <SnapshotImport onClose={() => setShowImport(false)} />
        </div>
      )}

      {/* Snapshot Manager Drawer */}
      {showSnapshotsList && (
        <div className="glass-surface bg-gray-50 dark:bg-gray-900/60 p-4 rounded-3xl border border-gray-200/60 dark:border-gray-800 mb-6">
          <SnapshotList onImportClick={() => setShowImport(true)} />
        </div>
      )}

      {/* Metrics Cards */}
      <StatsCards />

      {exportArchive && <ExportLibrary archive={exportArchive} snapshotLabel={latestArchiveSnapshot?.label || 'Instagram export'} />}

      {/* Snapshot Compare Selector */}
      {snapshots.length > 0 && <SnapshotCompare />}

      {/* Category Tabs & List */}
      {snapshots.length === 0 ? (
        <ExportWalkthrough onUpload={() => setShowImport(true)} />
      ) : currentComparison && selectedCategory ? (
        <div className="space-y-4">
          <CategoryTabs />
          <UserList users={selectedUsers} category={selectedCategory} />
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          Select snapshots above to view detailed comparison lists.
        </div>
      )}
    </div>
  );
}
