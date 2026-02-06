import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { searchIndex, SearchResult } from '../../lib/search';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FileCode, Hash, Box, Boxes, FunctionSquare } from 'lucide-react';

export function CommandMenu() {
  const navigate = useNavigate();
  const searchOpen = useStore((state) => state.searchOpen);
  const setSearchOpen = useStore((state) => state.setSearchOpen);
  const docs = useStore((state) => state.docs);

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    // Initialize search index
    if (docs.length > 0) {
      searchIndex.clear();
      searchIndex.addDocuments(docs);
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => {
      document.removeEventListener('keydown', down);
    };
  }, [docs, setSearchOpen, searchOpen]);

  React.useEffect(() => {
    if (query) {
      const searchResults = searchIndex.search(query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query]);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setSearchOpen(false);
      command();
    },
    [setSearchOpen]
  );

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'interface':
        return <Boxes className="mr-2 h-4 w-4" />;
      case 'type':
        return <Hash className="mr-2 h-4 w-4" />;
      case 'class':
        return <Box className="mr-2 h-4 w-4" />;
      case 'function':
        return <FunctionSquare className="mr-2 h-4 w-4" />;
      default:
        return <FileCode className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Documentation">
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={item.name}
                onSelect={() => {
                  runCommand(() => navigate(`/${item.kind}/${item.name}`));
                }}
              >
                {getIcon(item.kind)}
                <span>{item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground capitalize">
                  {item.summary ? `- ${item.summary.substring(0, 50)}...` : item.kind}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.length === 0 && (
          <CommandGroup heading="Suggestions">
            {docs.slice(0, 5).map((doc) => (
              <CommandItem
                key={doc.id}
                value={doc.name}
                onSelect={() => {
                  runCommand(() => navigate(`/${doc.kind}/${doc.name}`));
                }}
              >
                {getIcon(doc.kind)}
                <span>{doc.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
