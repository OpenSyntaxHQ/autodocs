import { Document as FlexSearchDocument } from 'flexsearch';
import { DocEntry } from '../store';

export interface SearchResult {
  id: string;
  name: string;
  kind: DocEntry['kind'];
  summary: string;
  score: number;
}

interface SearchDoc {
  [key: string]: string;
  id: string;
  name: string;
  kind: DocEntry['kind'];
  summary: string;
}

function createSearchDocumentIndex(): FlexSearchDocument<SearchDoc> {
  return new FlexSearchDocument({
    document: {
      id: 'id',
      index: ['name', 'summary', 'kind'],
    },
    tokenize: 'forward',
    resolution: 9,
  });
}

export class SearchIndex {
  private index: FlexSearchDocument<SearchDoc> = createSearchDocumentIndex();
  private store: Map<string, SearchDoc> = new Map();

  addDocuments(docs: DocEntry[]): void {
    for (const doc of docs) {
      const searchDoc: SearchDoc = {
        id: doc.id,
        name: doc.name,
        kind: doc.kind,
        summary: doc.documentation?.summary || '',
      };
      this.index.add(searchDoc);
      this.store.set(doc.id, searchDoc);
    }
  }

  search(query: string, limit = 10): SearchResult[] {
    if (!query) return [];

    const results = this.index.search(query, { limit });

    const combined: SearchResult[] = [];
    const seen = new Set<string>();

    for (const field of results) {
      for (const id of field.result) {
        const idStr = String(id);
        if (!seen.has(idStr)) {
          seen.add(idStr);
          const doc = this.store.get(idStr);
          if (doc) {
            combined.push({
              id: idStr,
              name: doc.name,
              kind: doc.kind,
              summary: doc.summary,
              score: 1,
            });
          }
        }
      }
    }

    return combined.slice(0, limit);
  }

  clear(): void {
    this.index = createSearchDocumentIndex();
    this.store.clear();
  }
}

export const searchIndex = new SearchIndex();
