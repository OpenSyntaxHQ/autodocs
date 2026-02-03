import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandMenu } from '../Search/CommandMenu';

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden border-r border-border md:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
