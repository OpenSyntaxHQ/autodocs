import FlexSearch from 'flexsearch';
import { DocEntry } from '../store';

export interface SearchResult {
  id: string;
  name: string;
  kind: string;
  summary: string;
  score: number;
}

interface SearchDoc {
  id: string;
  name: string;
  kind: string;
  summary: string;
}

export class SearchIndex {
  private index: FlexSearch.Document<SearchDoc, string[]>;
  private store: Map<string, SearchDoc> = new Map();

  constructor() {
    this.index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['name', 'summary', 'kind'],
      },
      tokenize: 'forward',
      resolution: 9,
    });
  }

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
    this.index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['name', 'summary', 'kind'],
      },
      tokenize: 'forward',
      resolution: 9,
    });
    this.store.clear();
  }
}

export const searchIndex = new SearchIndex();
