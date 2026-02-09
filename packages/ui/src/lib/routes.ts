import { slugify } from './utils';
import type { DocEntry } from '../store';

export function docPath(entry: Pick<DocEntry, 'kind' | 'id' | 'name'>): string {
  const slug = slugify(entry.name) || 'entry';
  const encodedId = encodeURIComponent(entry.id);
  return `/${entry.kind}/${encodedId}/${slug}`;
}
