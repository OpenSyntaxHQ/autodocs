import { Link } from 'react-router-dom';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Header() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleSearch = useStore((state) => state.toggleSearch);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="gap-0 p-0">
              <Sidebar className="w-full border-r-0" />
            </SheetContent>
          </Sheet>

          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <span className="text-sm font-semibold">A</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none">Autodocs</div>
              <div className="mt-1 text-xs text-muted-foreground">Type-driven reference</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <Button
            variant="outline"
            className="relative h-10 w-full flex-1 justify-start rounded-full border-border/60 bg-background/70 text-sm font-normal text-muted-foreground shadow-sm shadow-black/5 sm:max-w-[260px] sm:flex-none sm:pr-12"
            onClick={toggleSearch}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline-flex">Search documentation...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.35rem] hidden h-5 select-none items-center gap-1 rounded-full border border-border/60 bg-muted/70 px-2 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
