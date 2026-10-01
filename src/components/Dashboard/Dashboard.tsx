import { useEffect, useState } from 'react';
import { Plus, Sparkles, FolderArchive } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { CategoryTabs } from './CategoryTabs';
import { SnapshotCompare } from '../Snapshots/SnapshotCompare';
import { SnapshotImport } from '../Snapshots/SnapshotImport';
import { SnapshotList } from '../Snapshots/SnapshotList';
import { UserList } from '../UserList/UserList';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { EmptyState } from '../Common/EmptyState';
import { LoadingState } from '../Common/LoadingState';
import { sampleSnapshots } from '../../data/sampleData';

export function Dashboard({ onActionReady }: { onActionReady?: (openImport: () => void, openHistory: () => void) => void }) {
  const {
    snapshots,
    currentComparison,
    selectedCategory,
    isLoading,
    addNewSnapshot,
  } = useSnapshots();

  const [showImport, setShowImport] = useState(false);
  const [showSnapshotsList, setShowSnapshotsList] = useState(false);

  useEffect(() => {
    onActionReady?.(() => setShowImport(true), () => setShowSnapshotsList(true));
  }, [onActionReady]);

  const loadSampleData = () => {
    sampleSnapshots.forEach((snap) => addNewSnapshot(snap));
  };

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
          <h2 className="dashboard-title text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Follower Analytics
          </h2>
          <p className="dashboard-subtitle text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Audit your audience, detect unfollowers, and track non-reciprocal accounts safely.
          </p>
        </div>

        <div className="dashboard-actions flex items-center gap-2">
          {snapshots.length === 0 && (
            <button
              onClick={loadSampleData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          )}

          <button
            onClick={() => setShowSnapshotsList(!showSnapshotsList)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow-2xs"
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
        <div className="mb-6">
          <SnapshotImport onClose={() => setShowImport(false)} />
        </div>
      )}

      {/* Snapshot Manager Drawer */}
      {showSnapshotsList && (
        <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-3xl border border-gray-200/60 dark:border-gray-800 mb-6">
          <SnapshotList onImportClick={() => setShowImport(true)} />
        </div>
      )}

      {/* Metrics Cards */}
      <StatsCards />

      {/* Snapshot Compare Selector */}
      {snapshots.length > 0 && <SnapshotCompare />}

      {/* Category Tabs & List */}
      {snapshots.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-8 h-8" />}
          title="No follower data yet"
          description="Get started by loading realistic sample data to explore FollowTrack, or import your official Instagram export files."
          action={{
            label: 'Load Demo Data',
            onClick: loadSampleData,
          }}
        />
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
