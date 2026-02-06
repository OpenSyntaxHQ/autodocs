import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import { loadConfig, resolveConfigPaths } from '../config';

interface CheckOptions {
  config?: string;
}

export function registerCheck(program: Command): void {
  program
    .command('check')
    .description('Validate configuration and check for issues')
    .option('-c, --config <path>', 'Config file path')
    .action(async (options: unknown) => {
      const spinner = ora('Checking configuration...').start();

      try {
        const opts = options as CheckOptions;
        // Load config
        let config = await loadConfig(opts.config);

        if (!config) {
          spinner.fail('No configuration found');
          console.log(chalk.yellow('\nRun: autodocs init'));
          process.exit(1);
        }

        const configDir = opts.config ? path.dirname(opts.config) : process.cwd();
        config = resolveConfigPaths(config, configDir);

        spinner.succeed(chalk.green('Configuration loaded'));

        const issues: string[] = [];
        const warnings: string[] = [];

        // Check files
        spinner.start('Checking source files...');

        const files = await glob(config.include, {
          ignore: config.exclude || [],
          absolute: true,
        });

        if (files.length === 0) {
          issues.push('No files found matching include patterns');
        } else {
          spinner.succeed(chalk.green(`Found ${files.length.toString()} source files`));
        }

        // Check tsconfig
        if (config.tsconfig) {
          spinner.start('Checking tsconfig...');

          try {
            await fs.access(config.tsconfig);
            spinner.succeed(chalk.green('tsconfig.json found'));
          } catch {
            warnings.push(`tsconfig.json not found: ${config.tsconfig}`);
            spinner.warn(chalk.yellow('tsconfig.json not found'));
          }
        }

        // Check output directory
        spinner.start('Checking output directory...');

        try {
          const stat = await fs.stat(config.output.dir);
          if (!stat.isDirectory()) {
            issues.push(`Output path exists but is not a directory: ${config.output.dir}`);
          }
          spinner.succeed(chalk.green('Output directory exists'));
        } catch {
          spinner.info('Output directory will be created');
        }

        // Summary
        console.log(chalk.cyan('\n=== Summary ==='));

        if (issues.length === 0 && warnings.length === 0) {
          console.log(chalk.green('✓ No issues found'));
        } else {
          if (issues.length > 0) {
            console.log(chalk.red('\nErrors:'));
            issues.forEach((issue) => {
              console.log(chalk.red(`  ✗ ${issue}`));
            });
          }

          if (warnings.length > 0) {
            console.log(chalk.yellow('\nWarnings:'));
            warnings.forEach((warn) => {
              console.log(chalk.yellow(`  ⚠ ${warn}`));
            });
          }
        }

        if (issues.length > 0) {
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Check failed');
        console.error(error);
        process.exit(1);
      }
    });
}
