import { Link, useLocation } from 'react-router-dom';
import { useStore, DocEntry } from '../../store';
import clsx from 'clsx';

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
      className={clsx(
        'w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <nav className="p-4">
        {Object.entries(grouped).map(([kind, items]) => (
          <div key={kind} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {kind}s
            </h3>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/${kind}/${item.name}`}
                    className={clsx(
                      'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      location.pathname === `/${kind}/${item.name}`
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
    </aside>
  );
}
