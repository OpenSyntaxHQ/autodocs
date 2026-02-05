#!/usr/bin/env node
import { Command } from 'commander';
import { registerInit } from './commands/init';
import { registerBuild } from './commands/build';
import { registerCheck } from './commands/check';
import { registerServe } from './commands/serve';
import { registerWatch } from './commands/watch';

const program = new Command();

program.name('autodocs').description('Engineer-first documentation generator').version('0.1.0');

registerInit(program);
registerBuild(program);
registerCheck(program);
registerServe(program);
registerWatch(program);

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
