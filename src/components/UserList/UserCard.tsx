import { ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { InstagramUser, CategoryType } from '../../types';
import { useSnapshots } from '../../contexts/SnapshotContext';

interface UserCardProps {
  user: InstagramUser;
  category: CategoryType;
}

const categoryPillConfig: Record<
  CategoryType,
  { label: string; badgeClass: string; avatarBg: string }
> = {
  unfollowedMe: {
    label: 'Unfollowed',
    badgeClass:
      'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50',
    avatarBg: 'bg-red-500',
  },
  theyDontFollowBack: {
    label: "Doesn't Follow Back",
    badgeClass:
      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
    avatarBg: 'bg-amber-500',
  },
  iDontFollowBack: {
    label: "You Don't Follow",
    badgeClass:
      'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
    avatarBg: 'bg-blue-500',
  },
  newFollowers: {
    label: 'New Follower',
    badgeClass:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
    avatarBg: 'bg-emerald-500',
  },
  mutualFollowers: {
    label: 'Mutual',
    badgeClass:
      'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50',
    avatarBg: 'bg-violet-500',
  },
};

export function UserCard({ user, category }: UserCardProps) {
  const { whitelistedUsers, unfollowedInSession, toggleWhitelist, toggleUnfollowed } =
    useSnapshots();

  const config = categoryPillConfig[category] || categoryPillConfig.theyDontFollowBack;
  const initial = user.username.charAt(0).toUpperCase();

  const isWhitelisted = whitelistedUsers.some(
    (u) => u.toLowerCase() === user.username.toLowerCase()
  );
  const isMarkedDone = unfollowedInSession.some(
    (u) => u.toLowerCase() === user.username.toLowerCase()
  );

  return (
    <div
      className={`user-card flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition duration-200 ${
        isMarkedDone
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-75'
          : isWhitelisted
          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0 ${
            isMarkedDone
              ? 'bg-emerald-500'
              : isWhitelisted
              ? 'bg-blue-500'
              : config.avatarBg
          }`}
        >
          {isMarkedDone ? '✓' : initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold truncate text-xs sm:text-sm ${
                isMarkedDone
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              @{user.username}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isMarkedDone
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : isWhitelisted
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : config.badgeClass
              }`}
            >
              {isMarkedDone ? 'Unfollowed / Done' : isWhitelisted ? 'Whitelisted / Kept' : config.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* Whitelist Toggle */}
        <button
          onClick={() => toggleWhitelist(user.username)}
          title={isWhitelisted ? 'Remove from whitelist' : 'Keep / Whitelist (Ignore)'}
          className={`p-1.5 rounded-xl transition ${
            isWhitelisted
              ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40'
              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
        </button>

        {/* Done Toggle */}
        <button
          onClick={() => toggleUnfollowed(user.username)}
          title={isMarkedDone ? 'Mark as not done' : 'Mark as unfollowed'}
          className={`p-1.5 rounded-xl transition ${
            isMarkedDone
              ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
              : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        {/* Direct Open */}
        <a
          href={user.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (!isMarkedDone && category === 'theyDontFollowBack') {
              toggleUnfollowed(user.username);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 rounded-xl transition"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
