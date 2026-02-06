import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CacheEntry, CacheMetadata, CacheOptions } from './types';

interface CacheIndexFile {
  version: string;
  timestamp: number;
  entries: Array<[string, CacheEntry]>;
}

export class FileCache {
  private index = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private indexPath: string;
  private docsDir: string;
  private ready: Promise<void>;

  constructor(options: CacheOptions) {
    this.options = {
      cacheDir: options.cacheDir,
      enabled: options.enabled ?? true,
    };

    this.indexPath = path.join(this.options.cacheDir, 'index.json');
    this.docsDir = path.join(this.options.cacheDir, 'docs');
    this.ready = this.options.enabled ? this.load() : Promise.resolve();
  }

  getCacheDir(): string {
    return this.options.cacheDir;
  }

  async getEntry(filePath: string): Promise<CacheEntry | null> {
    if (!this.options.enabled) {
      return null;
    }
    await this.ready;
    return this.index.get(this.normalize(filePath)) ?? null;
  }

  async readDocs<T = unknown>(entry: CacheEntry): Promise<T[]> {
    if (!this.options.enabled) {
      return [];
    }

    await this.ready;

    try {
      if (!entry.docsFile) {
        return [];
      }
      const docsPath = this.resolveDocsPath(entry.docsFile);
      const raw = await fs.readFile(docsPath, 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  async getFileHash(filePath: string): Promise<string> {
    if (!this.options.enabled) {
      return '';
    }

    try {
      const content = await fs.readFile(this.normalize(filePath));
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  async set(
    filePath: string,
    docs: unknown[],
    dependencies: string[],
    metadata: CacheMetadata
  ): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    await this.ready;

    const normalized = this.normalize(filePath);
    const fileHash = await this.getFileHash(normalized);
    const existing = this.index.get(normalized);
    let docsFile: string | null = null;

    if (docs.length > 0) {
      docsFile = this.createDocsFileName(normalized);
      await this.writeDocs(docsFile, docs);
    } else if (existing?.docsFile) {
      await this.removeDocsFile(existing.docsFile);
    }

    const entry: CacheEntry = {
      fileHash,
      timestamp: Date.now(),
      docsFile,
      dependencies: dependencies.map((dep) => this.normalize(dep)),
      metadata,
    };

    this.index.set(normalized, entry);
    await this.persist();
  }

  async invalidate(filePath: string): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    await this.ready;

    const queue = [this.normalize(filePath)];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);

      const entry = this.index.get(current);
      if (entry) {
        this.index.delete(current);
        if (entry.docsFile) {
          await this.removeDocsFile(entry.docsFile);
        }
      }

      for (const [candidate, candidateEntry] of this.index.entries()) {
        if (candidateEntry.dependencies.includes(current) && !visited.has(candidate)) {
          queue.push(candidate);
        }
      }
    }

    await this.pruneOrphanDocs();
    await this.persist();
  }

  async clear(): Promise<void> {
    this.index.clear();

    try {
      await fs.rm(this.options.cacheDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  private normalize(filePath: string): string {
    return path.normalize(path.resolve(filePath));
  }

  private resolveDocsPath(docsFile: string): string {
    return path.join(this.options.cacheDir, docsFile);
  }

  private createDocsFileName(filePath: string): string {
    const hash = crypto.createHash('sha256').update(filePath).digest('hex').slice(0, 24);
    return path.join('docs', `${hash}.json`);
  }

  private async writeDocs(docsFile: string, docs: unknown[]): Promise<void> {
    await fs.mkdir(this.docsDir, { recursive: true });
    const fullPath = this.resolveDocsPath(docsFile);
    await this.writeJsonAtomic(fullPath, docs);
  }

  private async removeDocsFile(docsFile: string): Promise<void> {
    try {
      await fs.unlink(this.resolveDocsPath(docsFile));
    } catch {
      // ignore
    }
  }

  private async pruneOrphanDocs(): Promise<void> {
    try {
      const entries = await fs.readdir(this.docsDir, { withFileTypes: true });
      const referenced = new Set(
        Array.from(this.index.values())
          .map((entry) => entry.docsFile)
          .filter((docsFile): docsFile is string => Boolean(docsFile))
          .map((docsFile) => path.basename(docsFile))
      );

      for (const entry of entries) {
        if (!entry.isFile()) {
          continue;
        }
        if (!referenced.has(entry.name)) {
          try {
            await fs.unlink(path.join(this.docsDir, entry.name));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.indexPath, 'utf-8');
      const parsed = JSON.parse(raw) as CacheIndexFile;
      const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      this.index = new Map(entries);
    } catch {
      this.index = new Map();
    }
  }

  private async persist(): Promise<void> {
    await fs.mkdir(this.options.cacheDir, { recursive: true });
    const data: CacheIndexFile = {
      version: '1.0.0',
      timestamp: Date.now(),
      entries: Array.from(this.index.entries()),
    };
    await this.writeJsonAtomic(this.indexPath, data);
  }

  private async writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  }
}
