import { VERSION } from '../src/index';

describe('Core Entry Point', () => {
  it('should export version', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });
});
