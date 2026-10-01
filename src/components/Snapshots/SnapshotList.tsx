import { useState } from 'react';
import { Trash2, Calendar, Users, UserPlus, AlertTriangle } from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { EmptyState } from '../Common/EmptyState';

export function SnapshotList({ onImportClick }: { onImportClick: () => void }) {
  const { snapshots, removeSnapshot, clearAll } = useSnapshots();
  const [confirmClear, setConfirmClear] = useState(false);

  if (snapshots.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        title="No Snapshots Yet"
        description="Create your first snapshot by importing your Instagram follower and following data."
        action={{
          label: 'Import Data',
          onClick: onImportClick,
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Saved Snapshots ({snapshots.length})
        </h3>

        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-medium">Delete all snapshots?</span>
            <button
              onClick={() => {
                clearAll();
                setConfirmClear(false);
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {snap.label}
                </h4>
                <button
                  onClick={() => removeSnapshot(snap.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Delete snapshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(snap.date).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/40 text-xs">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span><strong>{snap.followerCount}</strong> followers</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <UserPlus className="w-3.5 h-3.5 text-purple-500" />
                <span><strong>{snap.followingCount}</strong> following</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
