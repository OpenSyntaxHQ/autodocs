import { Link, useLocation } from 'react-router-dom';
import { useStore, DocEntry } from '../../store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const docs = useStore((state) => state.docs);
  const location = useLocation();

  // Group by kind
  const grouped = docs.reduce<Record<string, DocEntry[]>>((acc, doc) => {
    const kindDocs = acc[doc.kind] ?? [];
    kindDocs.push(doc);
    acc[doc.kind] = kindDocs;
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r border-border bg-sidebar/50 backdrop-blur-xl',
        className
      )}
    >
      <ScrollArea className="h-full">
        <nav className="p-4">
          <Link
            to="/"
            className="mb-6 flex items-center px-2 py-1 text-lg font-bold tracking-tight"
          >
            Autodocs
          </Link>

          {Object.entries(grouped).map(([kind, items]) => (
            <div key={kind} className="mb-6">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {kind.endsWith('s') ? `${kind}es` : `${kind}s`}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/${kind}/${item.name}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'w-full justify-start',
                        location.pathname === `/${kind}/${item.name}`
                          ? 'bg-secondary text-secondary-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
