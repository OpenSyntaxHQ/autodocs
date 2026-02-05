import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { glob } from 'glob';
import { loadConfig, resolveConfigPaths } from '../config';
import { FileWatcher } from '../utils/watcher';
import { computeConfigHash } from '../utils/configHash';
import {
  createProgram,
  extractDocs,
  DocEntry,
  PluginManager,
  FileCache,
  incrementalBuild,
} from '@opensyntaxhq/autodocs-core';
import { buildReactUI, loadPlugins, writeStaticDocs } from './build';

interface WatchBuildOptions {
  config: import('../config').AutodocsConfig;
  configDir: string;
  mode: 'full' | 'docs-only';
}

export async function runBuild({ config, configDir, mode }: WatchBuildOptions): Promise<void> {
  const spinner = ora('Loading plugins...').start();
  let pluginManager: PluginManager | null = null;

  try {
    const siteUrl = config.output.siteUrl ?? process.env.SITE_URL;
    const siteName =
      config.theme?.name && config.theme.name !== 'default' ? config.theme.name : 'Autodocs';

    pluginManager = new PluginManager(config);
    const manager = pluginManager;
    await loadPlugins(manager, config.plugins, configDir);

    spinner.text = 'Finding source files...';
    let files = await glob(config.include, {
      ignore: config.exclude || [],
      absolute: true,
    });

    files = await manager.runHook('beforeParse', files);

    if (files.length === 0) {
      spinner.fail('No files found matching include patterns');
      return;
    }

    const configHash = computeConfigHash(config);
    let docs: DocEntry[] = [];
    let rootDir = process.cwd();

    spinner.start('Parsing TypeScript...');

    if (config.cache !== false) {
      const cache = new FileCache({
        cacheDir: config.cacheDir || path.join(configDir, '.autodocs-cache'),
        enabled: true,
      });

      const result = await incrementalBuild({
        files,
        cache,
        tsconfig: config.tsconfig,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        compilerOptions: config.compilerOptions as any,
        configHash,
        onProgram: async (program, sourceFiles) => {
          await manager.runHook('afterParse', program);
          await manager.runHook('beforeExtract', sourceFiles);
        },
      });

      docs = result.docs;
      rootDir = result.rootDir;

      spinner.succeed(
        chalk.green(
          `Processed ${result.changedFiles.length.toString()} changed files (${result.fromCache.toString()} from cache)`
        )
      );
    } else {
      const parseResult = createProgram(files, {
        configFile: config.tsconfig,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        compilerOptions: config.compilerOptions as any,
        skipLibCheck: true,
      });

      await manager.runHook('afterParse', parseResult.program);
      await manager.runHook('beforeExtract', parseResult.sourceFiles);

      docs = extractDocs(parseResult.program, { rootDir: parseResult.rootDir });
      rootDir = parseResult.rootDir;

      spinner.succeed(chalk.green('TypeScript parsed'));
    }

    spinner.start('Extracting documentation...');
    docs = await manager.runHook('afterExtract', docs);
    docs = await manager.runHook('beforeGenerate', docs);

    spinner.start('Generating documentation...');

    switch (config.output.format) {
      case 'json': {
        const { generateJson } = await import('@opensyntaxhq/autodocs-core');
        await generateJson(docs, config.output.dir, { pretty: true, rootDir });
        break;
      }
      case 'markdown': {
        const { generateMarkdown } = await import('@opensyntaxhq/autodocs-core');
        await generateMarkdown(docs, config.output.dir);
        break;
      }
      case 'static':
      default: {
        if (mode === 'full') {
          await buildReactUI(docs, config.output.dir, spinner, {
            rootDir,
            configDir,
            uiConfig: {
              theme: config.theme,
              features: config.features,
              sidebar: config.sidebar,
            },
            siteUrl,
            siteName,
          });
        } else {
          await writeStaticDocs(docs, config.output.dir, {
            rootDir,
            configDir,
            uiConfig: {
              theme: config.theme,
              features: config.features,
              sidebar: config.sidebar,
            },
            siteUrl,
            siteName,
          });
        }
        break;
      }
    }

    await manager.runHook('afterGenerate', config.output.dir);
    await manager.cleanup();

    spinner.succeed(chalk.green('Documentation generated'));
  } catch (error) {
    spinner.fail('Build failed');
    console.error(error);
    if (pluginManager) {
      await pluginManager.cleanup();
    }
  }
}

export function registerWatch(program: Command): void {
  program
    .command('watch')
    .description('Watch files and rebuild on changes')
    .option('-c, --config <path>', 'Config file path')
    .action(async (options: { config?: string }) => {
      const spinner = ora('Loading configuration...').start();

      try {
        let config = await loadConfig(options.config);

        if (!config) {
          spinner.fail('No configuration found');
          return;
        }

        const configDir = options.config ? path.dirname(options.config) : process.cwd();
        config = resolveConfigPaths(config, configDir);

        spinner.succeed('Configuration loaded');

        console.log(chalk.cyan('\nBuilding initial docs...'));
        await runBuild({ config, configDir, mode: 'full' });

        const watcher = new FileWatcher({
          paths: config.include,
          ignored: config.exclude,
        });

        watcher.on('ready', () => {
          console.log(chalk.green('\n✓ Watching for changes...'));
          console.log(chalk.gray('Press Ctrl+C to stop\n'));
        });

        watcher.on('change', (changedPath: string) => {
          console.log(chalk.cyan(`\nFile changed: ${changedPath}`));
          console.log(chalk.cyan('Rebuilding docs...\n'));

          void runBuild({ config, configDir, mode: 'docs-only' }).then(() => {
            console.log(chalk.green('✓ Docs updated\n'));
          });
        });

        watcher.start();

        process.on('SIGINT', () => {
          console.log(chalk.yellow('\nStopping watcher...'));
          void watcher.stop().then(() => process.exit(0));
        });
      } catch (error) {
        spinner.fail('Watch failed');
        console.error(error);
        process.exit(1);
      }
    });
}
