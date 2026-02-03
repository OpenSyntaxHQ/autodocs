import { useStore, DocEntry } from '../store';
import { Link } from 'react-router-dom';

export function HomePage() {
  const docs = useStore((state) => state.docs);

  // Group by kind
  const grouped = docs.reduce<Record<string, DocEntry[]>>((acc, doc) => {
    const kindDocs = acc[doc.kind] ?? [];
    kindDocs.push(doc);
    acc[doc.kind] = kindDocs;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">API Documentation</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Complete API reference for your project
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([kind, items]) => (
          <div key={kind} className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="mb-4 text-xl font-bold capitalize">
              {kind.endsWith('s') ? `${kind}es` : `${kind}s`}
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {items.length} {kind}
              {items.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-2">
              {items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/${kind}/${item.name}`}
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              {items.length > 5 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">
                  and {items.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {docs.length === 0 && (
        <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No documentation found. Make sure docs.json is available.
          </p>
        </div>
      )}
    </div>
  );
}
