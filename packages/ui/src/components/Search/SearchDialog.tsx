import { useEffect, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { SearchIndex, SearchResult } from '../../lib/search';
import clsx from 'clsx';

let searchIndex: SearchIndex | null = null;

export function SearchDialog() {
  const navigate = useNavigate();
  const searchOpen = useStore((state) => state.searchOpen);
  const setSearchOpen = useStore((state) => state.setSearchOpen);
  const docs = useStore((state) => state.docs);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize search index
  useEffect(() => {
    if (docs.length > 0 && !searchIndex) {
      searchIndex = new SearchIndex();
      searchIndex.addDocuments(docs);
    }
  }, [docs]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }

      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSearchOpen]);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  // Search
  useEffect(() => {
    if (!query || !searchIndex) {
      setResults([]);
      return;
    }

    const searchResults = searchIndex.search(query, 10);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    void navigate(`/${result.kind}/${result.name}`);
    setSearchOpen(false);
  };

  const handleClose = () => {
    setSearchOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    handleSelect(result);
  };

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-16">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center border-b border-gray-200 px-4 dark:border-gray-800">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent px-4 py-4 text-gray-900 outline-none dark:text-gray-100"
          />
          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => {
                  handleResultClick(result);
                }}
                className={clsx(
                  'w-full border-b border-gray-100 px-4 py-3 text-left transition-colors dark:border-gray-800',
                  index === selectedIndex
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{result.name}</div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {result.kind}
                  </span>
                </div>
                {result.summary && (
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {result.summary}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
