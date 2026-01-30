import chalk from 'chalk';
import { Command } from 'commander';

export function registerServe(program: Command) {
  program
    .command('serve')
    .description('Serve documentation locally')
    .action(() => {
      console.log(chalk.cyan('Starting development server...'));
      console.log(chalk.yellow('NOTE: This is a placeholder for the dev server'));
    });
}
