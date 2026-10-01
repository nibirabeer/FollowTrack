import React from 'react';
import { Home, Users, Zap, PlusSquare, History } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'dashboard' | 'categories' | 'queue' | 'import' | 'snapshots';
  onTabChange: (tab: 'dashboard' | 'categories' | 'queue' | 'import' | 'snapshots') => void;
  unfollowedCount: number;
}

export function MobileNav({ activeTab, onTabChange, unfollowedCount }: MobileNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-[#efefef] dark:border-[#262626] pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-gray-900 dark:text-white scale-105'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] font-medium mt-0.5">Overview</span>
        </button>

        {/* Categories */}
        <button
          onClick={() => onTabChange('categories')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'categories'
              ? 'text-gray-900 dark:text-white scale-105'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'categories' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] font-medium mt-0.5">Accounts</span>
        </button>

        {/* Fast Queue */}
        <button
          onClick={() => onTabChange('queue')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'queue'
              ? 'text-[#f09433] scale-105'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="relative">
            <Zap className={`w-5 h-5 ${activeTab === 'queue' ? 'fill-current stroke-[2]' : 'stroke-[1.75]'}`} />
            {unfollowedCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#dc2743] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unfollowedCount > 99 ? '99+' : unfollowedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Queue</span>
        </button>

        {/* Import */}
        <button
          onClick={() => onTabChange('import')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'import'
              ? 'text-gray-900 dark:text-white scale-105'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          <PlusSquare className={`w-5 h-5 ${activeTab === 'import' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] font-medium mt-0.5">Import</span>
        </button>

        {/* Snapshots */}
        <button
          onClick={() => onTabChange('snapshots')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'snapshots'
              ? 'text-gray-900 dark:text-white scale-105'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === 'snapshots' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] font-medium mt-0.5">History</span>
        </button>
      </div>
    </nav>
  );
}

