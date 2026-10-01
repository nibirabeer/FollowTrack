import React from 'react';
import { Users, UserPlus, UserMinus, UserX, UserCheck } from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';

export function StatsCards() {
  const { snapshots, currentComparison } = useSnapshots();

  // Find the latest snapshot by date
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[0] : null;

  const totalFollowers = latestSnapshot ? latestSnapshot.followerCount : 0;
  const totalFollowing = latestSnapshot ? latestSnapshot.followingCount : 0;
  const notFollowingBack = currentComparison ? currentComparison.theyDontFollowBack.length : 0;
  const unfollowedCount = currentComparison ? currentComparison.unfollowedMe.length : 0;
  const newFollowers = currentComparison ? currentComparison.newFollowers.length : 0;

  const hasData = snapshots.length > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <StatCard
        title="Total Followers"
        value={hasData ? totalFollowers : '-'}
        subtitle={latestSnapshot ? latestSnapshot.label : undefined}
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
        color="blue"
      />
      <StatCard
        title="Total Following"
        value={hasData ? totalFollowing : '-'}
        subtitle={latestSnapshot ? latestSnapshot.label : undefined}
        icon={<UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />}
        color="purple"
      />
      <StatCard
        title="Not Following Back"
        value={hasData && currentComparison ? notFollowingBack : '-'}
        subtitle="You follow &bull; They don't"
        icon={<UserMinus className="w-5 h-5 sm:w-6 sm:h-6" />}
        color="amber"
      />
      <StatCard
        title={unfollowedCount > 0 ? 'Unfollowed You' : 'New Followers'}
        value={
          hasData && currentComparison
            ? unfollowedCount > 0
              ? unfollowedCount
              : newFollowers
            : '-'
        }
        subtitle={
          unfollowedCount > 0
            ? 'Lost since baseline'
            : hasData && currentComparison
            ? 'Gained since baseline'
            : undefined
        }
        icon={
          unfollowedCount > 0 ? (
            <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          )
        }
        color={unfollowedCount > 0 ? 'rose' : 'emerald'}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'amber' | 'rose' | 'emerald';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  };

  return (
    <div className="panel stat-card p-4 sm:p-5 flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">
          {title}
        </h3>
        <div className={`stat-icon p-2 rounded-xl shrink-0 ${colorMap[color]}`}>{icon}</div>
      </div>
      <div>
        <div className="stat-value text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
