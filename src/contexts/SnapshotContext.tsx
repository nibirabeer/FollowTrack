import React, { createContext, useContext, useEffect, useState } from 'react';
import { Snapshot, ComparisonResult, CategoryType } from '../types';
import { saveSnapshots, loadSnapshots, addSnapshot, deleteSnapshot, clearAllSnapshots } from '../lib/storage';
import { compareSnapshots } from '../lib/comparison';
import { clearExportArchives, deleteExportArchive } from '../lib/exportArchiveStorage';

interface SnapshotContextType {
  snapshots: Snapshot[];
  currentComparison: ComparisonResult | null;
  selectedCategory: CategoryType | null;
  whitelistedUsers: string[];
  unfollowedInSession: string[];
  isLoading: boolean;
  error: string | null;
  addNewSnapshot: (snapshot: Snapshot) => void;
  removeSnapshot: (id: string) => void;
  clearAll: () => void;
  runComparison: (oldId: string, newId: string) => void;
  setSelectedCategory: (cat: CategoryType | null) => void;
  setError: (err: string | null) => void;
  clearComparison: () => void;
  toggleWhitelist: (username: string) => void;
  toggleUnfollowed: (username: string) => void;
  clearSessionUnfollowed: () => void;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

const WHITELIST_KEY = 'followtrack_whitelist';
const UNFOLLOWED_KEY = 'followtrack_unfollowed_session';

export function SnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentComparison, setCurrentComparison] = useState<ComparisonResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [whitelistedUsers, setWhitelistedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WHITELIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [unfollowedInSession, setUnfollowedInSession] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(UNFOLLOWED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loaded = loadSnapshots();
      setSnapshots(loaded);
    } catch (err) {
      setError('Failed to load snapshots.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleWhitelist = (username: string) => {
    const key = username.toLowerCase();
    setWhitelistedUsers((prev) => {
      const exists = prev.some((u) => u.toLowerCase() === key);
      const updated = exists
        ? prev.filter((u) => u.toLowerCase() !== key)
        : [...prev, username];
      localStorage.setItem(WHITELIST_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleUnfollowed = (username: string) => {
    const key = username.toLowerCase();
    setUnfollowedInSession((prev) => {
      const exists = prev.some((u) => u.toLowerCase() === key);
      const updated = exists
        ? prev.filter((u) => u.toLowerCase() !== key)
        : [...prev, username];
      localStorage.setItem(UNFOLLOWED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearSessionUnfollowed = () => {
    setUnfollowedInSession([]);
    localStorage.removeItem(UNFOLLOWED_KEY);
  };

  const addNewSnapshot = (snapshot: Snapshot) => {
    try {
      const updated = addSnapshot(snapshot);
      setSnapshots(updated);
    } catch (err) {
      setError('Failed to add snapshot.');
    }
  };

  const removeSnapshot = (id: string) => {
    try {
      const updated = deleteSnapshot(id);
      void deleteExportArchive(id).catch(() => undefined);
      setSnapshots(updated);
      if (currentComparison) {
        clearComparison();
      }
    } catch (err) {
      setError('Failed to delete snapshot.');
    }
  };

  const clearAll = () => {
    try {
      clearAllSnapshots();
      void clearExportArchives().catch(() => undefined);
      setSnapshots([]);
      clearComparison();
    } catch (err) {
      setError('Failed to clear snapshots.');
    }
  };

  const runComparison = (oldId: string, newId: string) => {
    const oldSnap = snapshots.find((s) => s.id === oldId);
    const newSnap = snapshots.find((s) => s.id === newId);
    if (!oldSnap || !newSnap) {
      setError('Selected snapshots not found.');
      return;
    }

    setIsLoading(true);
    try {
      const result = compareSnapshots(oldSnap, newSnap);
      setCurrentComparison(result);
      if (oldId === newId || result.unfollowedMe.length === 0) {
        setSelectedCategory('theyDontFollowBack');
      } else {
        setSelectedCategory('unfollowedMe');
      }
    } catch (err) {
      setError('Failed to compare snapshots.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearComparison = () => {
    setCurrentComparison(null);
    setSelectedCategory(null);
  };

  return (
    <SnapshotContext.Provider
      value={{
        snapshots,
        currentComparison,
        selectedCategory,
        whitelistedUsers,
        unfollowedInSession,
        isLoading,
        error,
        addNewSnapshot,
        removeSnapshot,
        clearAll,
        runComparison,
        setSelectedCategory,
        setError,
        clearComparison,
        toggleWhitelist,
        toggleUnfollowed,
        clearSessionUnfollowed,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshots() {
  const context = useContext(SnapshotContext);
  if (context === undefined) {
    throw new Error('useSnapshots must be used within a SnapshotProvider');
  }
  return context;
}
