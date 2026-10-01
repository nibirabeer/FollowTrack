import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Flame,
  Zap,
} from 'lucide-react';
import { InstagramUser } from '../../types';
import { useSnapshots } from '../../contexts/SnapshotContext';

interface QuickUnfollowQueueProps {
  users: InstagramUser[];
  onClose: () => void;
}

const SAFE_SESSION_LIMIT = 30; // Recommended max unfollows per hour

export function QuickUnfollowQueue({ users, onClose }: QuickUnfollowQueueProps) {
  const {
    whitelistedUsers,
    unfollowedInSession,
    toggleWhitelist,
    toggleUnfollowed,
  } = useSnapshots();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out whitelisted accounts from the queue
  const queueUsers = users.filter(
    (u) => !whitelistedUsers.some((w) => w.toLowerCase() === u.username.toLowerCase())
  );

  const currentUser = queueUsers[currentIndex] || null;
  const isUnfollowed = currentUser
    ? unfollowedInSession.some((u) => u.toLowerCase() === currentUser.username.toLowerCase())
    : false;
  const isWhitelisted = currentUser
    ? whitelistedUsers.some((u) => u.toLowerCase() === currentUser.username.toLowerCase())
    : false;

  const sessionCount = unfollowedInSession.length;

  const handleNext = () => {
    if (currentIndex < queueUsers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleOpenAndMark = () => {
    if (!currentUser) return;
    window.open(currentUser.profileUrl, '_blank');
    if (!isUnfollowed) {
      toggleUnfollowed(currentUser.username);
    }
    handleNext();
  };

  const handleToggleKeep = () => {
    if (!currentUser) return;
    toggleWhitelist(currentUser.username);
    handleNext();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleOpenAndMark();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentUser, isUnfollowed]);

  if (queueUsers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Caught Up!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
            There are no non-whitelisted accounts left to review in this category.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((currentIndex / queueUsers.length) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-700 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-750 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Safe Fast Unfollow Assistant
              </h3>
              <p className="text-[11px] text-gray-400">
                Account {currentIndex + 1} of {queueUsers.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Safety Counter */}
        <div className="bg-gray-50 dark:bg-gray-900/60 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Session Cleaned: <strong>{sessionCount}</strong></span>
            </span>
            <span
              className={`font-semibold ${
                sessionCount >= SAFE_SESSION_LIMIT ? 'text-amber-500' : 'text-emerald-500'
              }`}
            >
              {sessionCount} / {SAFE_SESSION_LIMIT} Safe Limit/hr
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-amber-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {sessionCount >= SAFE_SESSION_LIMIT && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Safety Notice:</strong> You reached {SAFE_SESSION_LIMIT} unfollows this hour. Take a 30-minute break to keep your Instagram account 100% safe from rate limits!
              </span>
            </div>
          )}
        </div>

        {/* Current User Card */}
        {currentUser && (
          <div className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>@{currentUser.username}</span>
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                Does Not Follow You Back
              </p>
            </div>

            {/* Big Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleOpenAndMark}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
              >
                <span>Open Profile & Unfollow</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleKeep}
                  className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Keep / Whitelist</span>
                </button>

                <button
                  onClick={() => toggleUnfollowed(currentUser.username)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                    isUnfollowed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isUnfollowed ? 'text-emerald-500' : 'text-gray-400'
                    }`}
                  />
                  <span>{isUnfollowed ? 'Marked Done' : 'Mark Done'}</span>
                </button>
              </div>
            </div>

            {/* Keyboard tips */}
            <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-4">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">Space</kbd> to Open & Next</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">&rarr;</kbd> to Skip</span>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= queueUsers.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-40 transition"
          >
            <span>Skip Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

