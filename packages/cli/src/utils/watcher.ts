import chokidar from 'chokidar';
import { EventEmitter } from 'events';

export interface WatchOptions {
  paths: string[];
  ignored?: string[];
  debounce?: number;
}

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private options: Required<WatchOptions>;

  constructor(options: WatchOptions) {
    super();

    this.options = {
      paths: options.paths,
      ignored: options.ignored || ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      debounce: options.debounce || 300,
    };
  }

  start(): void {
    this.watcher = chokidar.watch(this.options.paths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (path) => {
      this.handleChange(path);
    });
    this.watcher.on('add', (path) => {
      this.handleChange(path);
    });
    this.watcher.on('unlink', (path) => {
      this.handleChange(path);
    });

    this.emit('ready');
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private handleChange(path: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.emit('change', path);
    }, this.options.debounce);
  }
}
