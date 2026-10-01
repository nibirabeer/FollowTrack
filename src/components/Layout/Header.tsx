import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header id="top" className="app-header sticky top-0 z-40 bg-white/95 dark:bg-[#171619]/95 backdrop-blur-md border-b transition-colors duration-200">
      <div className="app-header-inner mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a className="brand-wordmark" href="#top" aria-label="FollowTrack home">
          <span className="brand-monogram" aria-hidden="true">F</span>
          <span className="brand-name">follow<span>track</span></span>
        </a>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="theme-toggle p-2 rounded-full hover:bg-[#fafafa] dark:hover:bg-[#1f1f1f] text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
