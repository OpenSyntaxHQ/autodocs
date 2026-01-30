#!/usr/bin/env node
import { Command } from 'commander';
import { registerInit } from './commands/init';
import { registerBuild } from './commands/build';
import { registerServe } from './commands/serve';

const program = new Command();

program
  .name('autodocs')
  .description('Engineer-first documentation generator')
  .version('0.1.0');

registerInit(program);
registerBuild(program);
registerServe(program);

program.parse(process.argv);
