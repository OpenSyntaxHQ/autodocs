import { Command } from 'commander';

describe('CLI Entry Point', () => {
  it('should define command', () => {
    const program = new Command();
    program.name('autodocs');
    expect(program.name()).toBe('autodocs');
  });
});
