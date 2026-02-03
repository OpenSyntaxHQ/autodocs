import { Menu, Moon, Sun, Search } from 'lucide-react';
import { useStore } from '../../store';

export function Header() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const setSearchOpen = useStore((state) => state.setSearchOpen);

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-xl font-bold">Autodocs</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchClick}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:inline">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
