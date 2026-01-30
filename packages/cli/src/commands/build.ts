import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { createProgram, extractDocs, generateDocs } from '@opensyntaxhq/autodocs-core';
import fs from 'fs';

export function registerBuild(program: Command) {
  program
    .command('build')
    .description('Build documentation')
    .action(async () => {
      const spinner = ora('Building documentation...').start();
      
      try {
        // In a real implementation, we would read autodocs.config.ts
        const entryFile = path.join(process.cwd(), 'src/index.ts');
        
        if (!fs.existsSync(entryFile)) {
             spinner.warn('No src/index.ts found. defaulting to empty build.');
             return;
        }

        const tsProgram = createProgram([entryFile]);
        const docs = extractDocs(tsProgram);
        
        generateDocs(docs, path.join(process.cwd(), 'docs-dist'));
        
        spinner.succeed(chalk.green('Documentation built successfully!'));
      } catch (err) {
        spinner.fail(chalk.red('Build failed'));
        console.error(err);
        process.exit(1);
      }
    });
}
