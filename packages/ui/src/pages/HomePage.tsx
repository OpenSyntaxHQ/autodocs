import { useStore, DocEntry } from '../store';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import defaultLogo from '@/assets/logo.svg';

function pluralize(kind: string, count: number): string {
  const singular = kind.toLowerCase();
  if (count === 1) return singular;
  if (singular === 'class') return 'classes';
  if (
    singular.endsWith('s') ||
    singular.endsWith('x') ||
    singular.endsWith('ch') ||
    singular.endsWith('sh')
  ) {
    return `${singular}es`;
  }
  return `${singular}s`;
}

function getModuleName(fileName: string): string {
  return fileName
    .replace(/\\/g, '/')
    .replace(/\.[^/.]+$/, '')
    .replace(/^.*\/src\//, '');
}

export function HomePage() {
  const docs = useStore((state) => state.docs);
  const toggleSearch = useStore((state) => state.toggleSearch);
  const config = useStore((state) => state.config);

  // Group by kind
  const grouped = docs.reduce<Record<string, DocEntry[]>>((acc, doc) => {
    const kindDocs = acc[doc.kind] ?? [];
    kindDocs.push(doc);
    acc[doc.kind] = kindDocs;
    return acc;
  }, {});

  const totalEntries = docs.length;
  const kindCount = Object.keys(grouped).length;
  const moduleCount = new Set(docs.map((doc) => doc.module || getModuleName(doc.fileName))).size;
  const firstDoc = docs[0];
  const kindEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  const searchEnabled = config?.features?.search !== false;
  const logoSrc = config?.theme?.logo || defaultLogo;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-8 shadow-glow surface-glass">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-56 w-56 rounded-full blur-[90px]"
          style={{ background: 'var(--glow-1)' }}
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={logoSrc}
                alt="Autodocs"
                className="h-12 w-12 rounded-2xl object-contain shadow-sm shadow-black/20"
              />
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]"
              >
                Autodocs
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                API Documentation
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Generated from your TypeScript types and comments. Explore every surface area, from
                interfaces to functions, in a format that stays legible at scale.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default" asChild className="rounded-full">
                <Link to={firstDoc ? `/${firstDoc.kind}/${firstDoc.name}` : '/'}>
                  Explore the API
                </Link>
              </Button>
              {searchEnabled && (
                <Button variant="outline" className="rounded-full" onClick={toggleSearch}>
                  Open search (⌘K)
                </Button>
              )}
            </div>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-3 lg:w-[420px] lg:self-start">
            <div className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Entries
              </p>
              <p className="mt-2 text-3xl font-semibold">{totalEntries}</p>
            </div>
            <div className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Kinds
              </p>
              <p className="mt-2 text-3xl font-semibold">{kindCount}</p>
            </div>
            <div className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Modules
              </p>
              <p className="mt-2 text-3xl font-semibold">{moduleCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Browse by kind</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump into the surface area that matters most.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {totalEntries} entries
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {kindEntries.map(([kind, items], index) => (
            <Card
              key={kind}
              className="group relative overflow-hidden border-border/60 bg-card/70 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-rise"
              style={{ animationDelay: `${String(index * 70)}ms` }}
            >
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-[70px] transition-opacity duration-300 group-hover:opacity-60"
                style={{ background: 'var(--glow-2)' }}
              />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold capitalize">
                    {pluralize(kind, items.length)}
                  </h3>
                  <Badge variant="secondary" className="rounded-full">
                    {items.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {items.length} {pluralize(kind, items.length)} documented.
                </p>
                <ul className="space-y-2 text-sm">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/${kind}/${item.name}`}
                        className="text-primary font-medium hover:underline underline-offset-4"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  {items.length > 5 && (
                    <li className="text-xs text-muted-foreground">+{items.length - 5} more</li>
                  )}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {docs.length === 0 && (
        <Card className="border-dashed border-border/60 bg-card/60 p-10 text-center shadow-none">
          <p className="text-muted-foreground">
            No documentation found. Make sure docs.json is available.
          </p>
        </Card>
      )}
    </div>
  );
}
