import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 transition-all">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

