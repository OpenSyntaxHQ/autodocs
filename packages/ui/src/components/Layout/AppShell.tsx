import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandMenu } from '../Search/CommandMenu';

export function AppShell() {
  return (
    <div className="relative h-screen min-h-[100dvh] overflow-hidden text-foreground">
      <div className="relative flex h-full flex-col">
        <Header />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden h-full min-h-0 overflow-hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 min-h-0 overflow-y-auto px-6 pb-16 pt-6 lg:px-10 lg:pt-10">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
        <CommandMenu />
      </div>
    </div>
  );
}
