import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store';
import clsx from 'clsx';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useStore((state) => state.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        className={clsx(
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
