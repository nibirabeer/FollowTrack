import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-surface flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm my-4 transition-colors">
      <div className="p-4 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-medium text-sm rounded-xl transition shadow-sm shadow-violet-500/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
