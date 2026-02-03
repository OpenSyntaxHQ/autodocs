import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { glob } from 'glob';
import { exec } from 'child_process';
import { promisify } from 'util';
import fsPromises from 'fs/promises';
import { loadConfig, resolveConfigPaths } from '../config';
import { createProgram, extractDocs, DocEntry } from '@opensyntaxhq/autodocs-core';

const execAsync = promisify(exec);

interface BuildOptions {
  config?: string;
  output?: string;
  format?: 'static' | 'json' | 'markdown';
  clean?: boolean;
  verbose?: boolean;
  cache?: boolean;
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fsPromises.mkdir(dest, { recursive: true });

  const entries = await fsPromises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fsPromises.copyFile(srcPath, destPath);
    }
  }
}

async function buildReactUI(
  docs: DocEntry[],
  outputDir: string,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  // Find the UI package using require.resolve - works in monorepo
  let uiDir: string;
  let uiDistDir: string;

  try {
    // Try to resolve the UI package from the monorepo
    const uiPackageJson = require.resolve('@opensyntaxhq/autodocs-ui/package.json');
    uiDir = path.dirname(uiPackageJson);
    uiDistDir = path.join(uiDir, 'dist');
  } catch {
    // Fallback: resolve relative to CLI package in monorepo
    uiDir = path.resolve(__dirname, '../../ui');
    uiDistDir = path.join(uiDir, 'dist');
  }

  // Check if UI package exists
  try {
    await fsPromises.access(uiDir);
  } catch {
    // UI package not found, fall back to basic HTML
    spinner.text = 'React UI not found, using basic HTML generator...';
    const { generateHtml } = await import('@opensyntaxhq/autodocs-core');
    await generateHtml(docs, outputDir);
    return;
  }

  // Step 1: Build the React UI
  spinner.text = 'Building React UI...';

  try {
    await execAsync('npm run build', { cwd: uiDir });
  } catch {
    spinner.fail(chalk.red('Failed to build React UI, falling back to basic HTML'));
    const { generateHtml } = await import('@opensyntaxhq/autodocs-core');
    await generateHtml(docs, outputDir);
    return;
  }

  spinner.succeed(chalk.green('React UI built'));

  // Step 2: Clean and create output directory
  spinner.start('Preparing output directory...');

  await fsPromises.rm(outputDir, { recursive: true, force: true });
  await fsPromises.mkdir(outputDir, { recursive: true });

  // Step 3: Copy React UI assets
  spinner.text = 'Copying UI assets...';

  await copyDirectory(uiDistDir, outputDir);

  spinner.succeed(chalk.green('UI assets copied'));

  // Step 4: Generate docs.json
  spinner.start('Generating docs data...');

  const docsData = {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    entries: docs,
  };

  await fsPromises.writeFile(
    path.join(outputDir, 'docs.json'),
    JSON.stringify(docsData, null, 2),
    'utf-8'
  );

  spinner.succeed(chalk.green('Documentation data generated'));
}

export function registerBuild(program: Command): void {
  program
    .command('build')
    .description('Build documentation')
    .option('-c, --config <path>', 'Config file path')
    .option('-o, --output <dir>', 'Output directory (overrides config)')
    .option('--format <format>', 'Output format (overrides config)')
    .option('--clean', 'Clean output directory first')
    .option('-v, --verbose', 'Verbose logging')
    .option('--no-cache', 'Disable caching')
    .action(async (options: unknown) => {
      const spinner = ora('Loading configuration...').start();

      try {
        const opts = options as BuildOptions;
        // Load config
        let config = await loadConfig(opts.config);

        if (!config) {
          spinner.fail('No configuration found');
          console.log(chalk.yellow('\nRun: autodocs init'));
          process.exit(1);
        }

        // Resolve paths
        const configDir = opts.config ? path.dirname(opts.config) : process.cwd();
        config = resolveConfigPaths(config, configDir);

        // Apply CLI overrides
        if (opts.output) {
          config.output.dir = path.resolve(opts.output);
        }
        if (opts.format) {
          config.output.format = opts.format;
        }
        if (opts.clean !== undefined) {
          config.output.clean = opts.clean;
        }
        if (opts.verbose) {
          config.verbose = true;
        }
        if (opts.cache === false) {
          config.cache = false;
        }

        spinner.text = 'Finding source files...';

        // Find files
        const files = await glob(config.include, {
          ignore: config.exclude || [],
          absolute: true,
        });

        if (files.length === 0) {
          spinner.fail('No files found matching include patterns');
          console.log(chalk.yellow('\nInclude patterns:'));
          config.include.forEach((p) => {
            console.log(chalk.yellow(`  ${p}`));
          });
          process.exit(1);
        }

        spinner.succeed(chalk.green(`Found ${files.length.toString()} files`));
        spinner.start('Parsing TypeScript...');

        const parseResult = createProgram(files, {
          configFile: config.tsconfig,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          compilerOptions: config.compilerOptions as any,
          skipLibCheck: true,
        });

        // Show diagnostics in verbose mode
        if (config.verbose && parseResult.diagnostics.length > 0) {
          spinner.info('TypeScript diagnostics:');
          parseResult.diagnostics.forEach((d) => {
            const message =
              typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
            console.log(chalk.gray(`  ${message}`));
          });
          spinner.start('Parsing TypeScript...');
        }

        spinner.succeed(chalk.green('TypeScript parsed'));
        spinner.start('Extracting documentation...');

        // Extract docs
        const docs = extractDocs(parseResult.program);

        if (docs.length === 0) {
          spinner.warn('No exported symbols found to document');
          console.log(
            chalk.yellow('\nMake sure your code exports interfaces, types, or functions')
          );
          process.exit(0);
        }

        spinner.succeed(chalk.green(`Extracted ${docs.length.toString()} entries`));
        spinner.start('Generating documentation...');

        // Generate documentation
        switch (config.output.format) {
          case 'json': {
            const { generateJson } = await import('@opensyntaxhq/autodocs-core');
            await generateJson(docs, config.output.dir, { pretty: true });
            break;
          }
          case 'markdown': {
            const { generateMarkdown } = await import('@opensyntaxhq/autodocs-core');
            await generateMarkdown(docs, config.output.dir);
            break;
          }
          case 'static':
          default: {
            // Build and integrate React UI
            await buildReactUI(docs, config.output.dir, spinner);
            break;
          }
        }

        spinner.succeed(chalk.green('Documentation generated!'));

        // Statistics
        console.log(chalk.cyan('\nStatistics:'));
        console.log(`  Files processed: ${files.length.toString()}`);
        console.log(`  Entries generated: ${docs.length.toString()}`);
        console.log(`  Output: ${config.output.dir}`);

        const kindCounts: Record<string, number> = {};
        docs.forEach((d) => {
          kindCounts[d.kind] = (kindCounts[d.kind] || 0) + 1;
        });

        console.log(chalk.cyan('\nBy kind:'));
        Object.entries(kindCounts).forEach(([kind, count]) => {
          console.log(`  ${kind}: ${count.toString()}`);
        });
      } catch (error) {
        spinner.fail(chalk.red('Build failed'));
        console.error(error);
        process.exit(1);
      }
    });
}
