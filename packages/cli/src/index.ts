#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program.name('autodocs').description('Engineer-first documentation generator').version('0.1.0');

program.parse(process.argv);

export interface AutodocsConfig {
  include: string[];
  exclude?: string[];
  output?: {
    dir?: string;
    format?: 'static' | 'json';
  };
  theme?: {
    name?: string;
    primaryColor?: string;
    logo?: string;
  };
  sidebar?: Array<{
    title: string;
    path?: string;
    autogenerate?: string;
  }>;
  plugins?: string[];
}

export function defineConfig(config: AutodocsConfig): AutodocsConfig {
  return config;
}
