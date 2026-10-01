import { UserMinus, UserCheck, Users, UserX, Heart } from 'lucide-react';
import { useSnapshots } from '../../contexts/SnapshotContext';
import { CategoryType } from '../../types';

interface TabItem {
  id: CategoryType;
  label: string;
  icon: typeof UserMinus;
  color: string;
  activeColor: string;
}

const tabs: TabItem[] = [
  {
    id: 'unfollowedMe',
    label: 'Unfollowed Me',
    icon: UserX,
    color: 'text-red-500',
    activeColor: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border-red-500',
  },
  {
    id: 'theyDontFollowBack',
    label: "Don't Follow Back",
    icon: UserMinus,
    color: 'text-amber-500',
    activeColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-500',
  },
  {
    id: 'iDontFollowBack',
    label: "I Don't Follow Back",
    icon: Users,
    color: 'text-blue-500',
    activeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-500',
  },
  {
    id: 'newFollowers',
    label: 'New Followers',
    icon: UserCheck,
    color: 'text-emerald-500',
    activeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-500',
  },
  {
    id: 'mutualFollowers',
    label: 'Mutual',
    icon: Heart,
    color: 'text-violet-500',
    activeColor: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border-violet-500',
  },
];

export function CategoryTabs() {
  const { currentComparison, selectedCategory, setSelectedCategory } = useSnapshots();

  if (!currentComparison) return null;

  return (
    <div className="category-strip flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const count = currentComparison[tab.id]?.length || 0;
        const isActive = selectedCategory === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all border ${
              isActive
                ? `${tab.activeColor} border-current shadow-xs`
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'inherit' : tab.color}`} />
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isActive
                  ? 'bg-white/80 dark:bg-black/40 text-current'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
