import { Menu, Moon, Sun, Search } from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '@/components/ui/button';

export function Header() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleSearch = useStore((state) => state.toggleSearch);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/50 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-6">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 items-center justify-end gap-4">
          <Button
            variant="outline"
            className="relative h-9 w-full justify-start rounded-lg bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
            onClick={toggleSearch}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline-flex">Search documentation...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
