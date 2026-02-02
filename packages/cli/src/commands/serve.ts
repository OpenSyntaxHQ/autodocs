import chalk from 'chalk';
import { Command } from 'commander';
import path from 'path';

interface ServeOptions {
  port: string;
  host: string;
  open?: boolean;
  docs: string;
}

export function registerServe(program: Command): void {
  program
    .command('serve')
    .description('Serve documentation locally')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('--host <host>', 'Host address', 'localhost')
    .option('-o, --open', 'Open browser automatically')
    .option('--docs <dir>', 'Docs directory to serve', './docs-dist')
    .action(async (options: unknown) => {
      try {
        const opts = options as ServeOptions;
        const express = await import('express');
        const open = opts.open ? await import('open') : null;

        const app = express.default();
        const docsDir = path.resolve(opts.docs);

        // Serve static files
        app.use(express.default.static(docsDir));

        // SPA fallback
        app.get('*', (_req: import('express').Request, res: import('express').Response) => {
          res.sendFile(path.join(docsDir, 'index.html'), (err: unknown) => {
            if (err) {
              res.status(404).send('Documentation not found. Run: autodocs build');
            }
          });
        });

        // Start server
        app.listen(parseInt(opts.port), opts.host, () => {
          const url = `http://${opts.host}:${opts.port}`;
          console.log(chalk.green('✓ Server running at:'), chalk.cyan(url));
          console.log(chalk.gray('\nPress Ctrl+C to stop'));

          if (open) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            open.default(url);
          }
        });
      } catch (error) {
        console.error(chalk.red('Error starting server:'), error);
        process.exit(1);
      }
    });
}
