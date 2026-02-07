import { watch, type FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';

export interface WatchOptions {
  paths: string[];
  ignored?: string[];
  debounce?: number;
}

export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
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
    const watcher = watch(this.options.paths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    this.watcher = watcher;

    watcher.on('change', (path: string) => {
      this.handleChange(path);
    });
    watcher.on('add', (path: string) => {
      this.handleChange(path);
    });
    watcher.on('unlink', (path: string) => {
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
