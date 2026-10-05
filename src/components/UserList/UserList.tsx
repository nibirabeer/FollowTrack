import { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  UserX,
  Copy,
  Check,
  Shield,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { InstagramUser, CategoryType } from '../../types';
import { UserCard } from './UserCard';
import { EmptyState } from '../Common/EmptyState';
import { QuickUnfollowQueue } from './QuickUnfollowQueue';
import { useSnapshots } from '../../contexts/SnapshotContext';

interface UserListProps {
  users: InstagramUser[];
  category: CategoryType;
}

type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-desc' | 'date-asc';

export function UserList({ users, category }: UserListProps) {
  const {
    whitelistedUsers,
    unfollowedInSession,
    clearSessionUnfollowed,
  } = useSnapshots();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc');
  const [copied, setCopied] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [hideWhitelisted, setHideWhitelisted] = useState(false);
  const [hideMarkedDone, setHideMarkedDone] = useState(false);

  const hasTimestamps = useMemo(() => {
    return users.some((u) => !!u.timestamp);
  }, [users]);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((u) => u.username.toLowerCase().includes(term));
    }

    // Filter out whitelisted if toggled
    if (hideWhitelisted) {
      result = result.filter(
        (u) => !whitelistedUsers.some((w) => w.toLowerCase() === u.username.toLowerCase())
      );
    }

    // Filter out marked done if toggled
    if (hideMarkedDone) {
      result = result.filter(
        (u) => !unfollowedInSession.some((w) => w.toLowerCase() === u.username.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'alpha-asc') {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === 'alpha-desc') {
        return b.username.localeCompare(a.username);
      }
      if (sortBy === 'date-desc') {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'date-asc') {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      }
      return 0;
    });

    return result;
  }, [users, searchTerm, sortBy, hideWhitelisted, hideMarkedDone, whitelistedUsers, unfollowedInSession]);

  const handleCopyAll = () => {
    const text = filteredAndSortedUsers.map((u) => u.username).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUnfollowCategory = category === 'theyDontFollowBack';

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<UserX className="w-8 h-8" />}
        title="No accounts in this category"
        description="Great news! There is nobody listed under this filter."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Action Banner for Unfollowers */}
      {isUnfollowCategory && (
        <div className="unfollow-assistant-banner">
          <div className="flex items-center gap-2.5">
            <div className="unfollow-assistant-icon">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="unfollow-assistant-title">
                Safe Unfollow Assistant
              </h4>
              <p className="unfollow-assistant-copy">
                Review each profile manually. Nothing is unfollowed automatically. <span>{unfollowedInSession.length} marked done</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {unfollowedInSession.length > 0 && (
              <button
                onClick={clearSessionUnfollowed}
                title="Clear marked-done statuses"
                aria-label="Clear marked-done statuses"
                className="px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear marks</span>
              </button>
            )}

            <button
              onClick={() => setShowQueue(true)}
              className="unfollow-assistant-cta"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review accounts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search, Sort & Filters Bar */}
      <div className="glass-surface flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by username..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggles */}
          <button
            onClick={() => setHideWhitelisted(!hideWhitelisted)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              hideWhitelisted
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Hide Kept ({whitelistedUsers.length})</span>
          </button>

          <button
            onClick={() => setHideMarkedDone(!hideMarkedDone)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              hideMarkedDone
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hide Done</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-[11px] text-gray-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="alpha-asc">A &rarr; Z</option>
              <option value="alpha-desc">Z &rarr; A</option>
              {hasTimestamps && (
                <>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </>
              )}
            </select>
          </div>

          {/* Copy List */}
          <button
            onClick={handleCopyAll}
            title="Copy username list to clipboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 whitespace-nowrap">
            <strong className="text-gray-900 dark:text-white">{filteredAndSortedUsers.length}</strong> of {users.length}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredAndSortedUsers.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          No users match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAndSortedUsers.map((user) => (
            <UserCard key={user.username} user={user} category={category} />
          ))}
        </div>
      )}

      {/* Quick Queue Modal */}
      {showQueue && (
        <QuickUnfollowQueue
          users={filteredAndSortedUsers}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
}
