import { Link, useLocation } from 'react-router-dom';
import { useStore, DocEntry } from '../../store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, slugify } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const docs = useStore((state) => state.docs);
  const config = useStore((state) => state.config);
  const location = useLocation();

  // Group by kind
  const grouped = docs.reduce<Record<string, DocEntry[]>>((acc, doc) => {
    const kindDocs = acc[doc.kind] ?? [];
    kindDocs.push(doc);
    acc[doc.kind] = kindDocs;
    return acc;
  }, {});

  const kinds = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const pluralize = (kind: string) => {
    const lower = kind.toLowerCase();
    if (lower === 'class') return 'Classes';
    if (
      lower.endsWith('s') ||
      lower.endsWith('x') ||
      lower.endsWith('ch') ||
      lower.endsWith('sh')
    ) {
      return `${kind}es`;
    }
    return `${kind}s`;
  };

  return (
    <aside
      className={cn(
        'h-full w-72 shrink-0 border-r border-border/60 bg-sidebar/70 backdrop-blur-xl',
        className
      )}
    >
      <ScrollArea className="h-full">
        <nav className="flex h-full flex-col gap-6 p-4">
          <div className="space-y-3">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Navigation
            </p>
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'w-full justify-start rounded-xl px-3 py-2 text-sm font-medium',
                location.pathname === '/'
                  ? 'bg-primary/10 text-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              Overview
              <span className="ml-auto text-xs text-muted-foreground">{docs.length}</span>
            </Link>
          </div>

          {config?.sidebar && config.sidebar.length > 0 && (
            <div className="space-y-3">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Sections
              </p>
              <ul className="space-y-1">
                {config.sidebar.map((item) => (
                  <li key={item.title}>
                    {item.path || item.autogenerate ? (
                      <Link
                        to={item.path ?? `/section/${slugify(item.title)}`}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'w-full justify-start rounded-xl px-3 py-2 text-sm',
                          location.pathname === (item.path ?? `/section/${slugify(item.title)}`)
                            ? 'bg-primary/10 text-foreground shadow-sm shadow-primary/10'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        )}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="block rounded-xl px-3 py-2 text-sm text-muted-foreground">
                        {item.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {kinds.map((kind) => {
              const items = grouped[kind] ?? [];
              const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
              const plural = pluralize(kind);

              return (
                <div key={kind} className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {plural}
                    </h3>
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                      {items.length}
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {sortedItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/${kind}/${item.name}`}
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'w-full justify-start rounded-xl px-3 py-2 text-sm',
                            location.pathname === `/${kind}/${item.name}`
                              ? 'bg-primary/10 text-foreground shadow-sm shadow-primary/10'
                              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                          )}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>
      </ScrollArea>
    </aside>
  );
}
