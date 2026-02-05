export interface CacheEntry {
  fileHash: string;
  timestamp: number;
  docsFile: string | null;
  dependencies: string[];
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  version: string;
  tsVersion: string;
  configHash: string;
}

export interface CacheOptions {
  cacheDir: string;
  enabled?: boolean;
}
