import { useState, useEffect, useMemo } from 'react';
import { GitCompare, ArrowRight, ArrowLeftRight, Clock } from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';

export function SnapshotCompare() {
  const { snapshots, runComparison } = useSnapshots();

  // Sort chronologically ascending for dropdowns (oldest first to newest)
  const chronologicalSnapshots = useMemo(() => {
    return [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [snapshots]);

  const [oldId, setOldId] = useState<string>('');
  const [newId, setNewId] = useState<string>('');

  useEffect(() => {
    if (chronologicalSnapshots.length >= 2) {
      const baseline = chronologicalSnapshots[0].id;
      const latest = chronologicalSnapshots[chronologicalSnapshots.length - 1].id;
      setOldId(baseline);
      setNewId(latest);
      runComparison(baseline, latest);
    } else if (chronologicalSnapshots.length === 1) {
      const single = chronologicalSnapshots[0].id;
      setOldId(single);
      setNewId(single);
      runComparison(single, single);
    }
  }, [chronologicalSnapshots]);

  if (chronologicalSnapshots.length === 0) return null;

  const handleOldChange = (id: string) => {
    setOldId(id);
    if (newId) runComparison(id, newId);
  };

  const handleNewChange = (id: string) => {
    setNewId(id);
    if (oldId) runComparison(oldId, id);
  };

  const handleSwap = () => {
    const temp = oldId;
    setOldId(newId);
    setNewId(temp);
    runComparison(newId, temp);
  };

  const isSingleSnapshot = chronologicalSnapshots.length === 1;

  return (
    <div className="glass-surface bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
              {isSingleSnapshot ? 'Active Snapshot Analysis' : 'Compare Snapshots'}
            </h2>
            <p className="text-[11px] text-gray-400 mt-1">
              {isSingleSnapshot
                ? 'Showing relationship breakdown for this snapshot.'
                : 'Comparing baseline against latest state to detect changes.'}
            </p>
          </div>
        </div>

        {!isSingleSnapshot && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-2xl">
            {/* Baseline Select */}
            <div className="flex-1 relative">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-0.5 block px-1">
                Baseline (Earlier)
              </label>
              <select
                value={oldId}
                onChange={(e) => handleOldChange(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {chronologicalSnapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center pt-4 sm:pt-4">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap baseline & target"
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
              >
                <ArrowLeftRight className="w-4 h-4 hidden sm:block" />
                <ArrowRight className="w-4 h-4 sm:hidden" />
              </button>
            </div>

            {/* Target Select */}
            <div className="flex-1 relative">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-0.5 block px-1">
                Target (Latest)
              </label>
              <select
                value={newId}
                onChange={(e) => handleNewChange(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {chronologicalSnapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isSingleSnapshot && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/60 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
            <Clock className="w-4 h-4 text-violet-500" />
            <span>
              <strong>{chronologicalSnapshots[0].label}</strong> &bull;{' '}
              {new Date(chronologicalSnapshots[0].date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
