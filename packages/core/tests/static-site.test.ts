import fs from 'fs/promises';
import path from 'path';
import { generateStaticSite } from '../src/deploy/static';
import { createTempDir } from './helpers/fixtures';

describe('generateStaticSite', () => {
  it('writes manifest and nojekyll without siteUrl', async () => {
    const tempDir = await createTempDir('autodocs-static-');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await generateStaticSite({ outputDir: tempDir, siteName: 'Autodocs' });

    await expect(fs.readFile(path.join(tempDir, '.nojekyll'), 'utf-8')).resolves.toBe('');
    const manifest = JSON.parse(
      await fs.readFile(path.join(tempDir, 'manifest.json'), 'utf-8')
    ) as { icons: Array<{ src: string }> };
    expect(manifest.icons).toEqual([]);
    await expect(fs.access(path.join(tempDir, 'sitemap.xml'))).rejects.toThrow();

    warnSpy.mockRestore();
  });

  it('writes sitemap, robots, and icons when available', async () => {
    const tempDir = await createTempDir('autodocs-static-');
    await fs.writeFile(path.join(tempDir, 'icon-192.png'), 'icon', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'icon-512.png'), 'icon', 'utf-8');

    await generateStaticSite({
      outputDir: tempDir,
      siteName: 'Autodocs',
      siteUrl: 'https://example.com/',
    });

    const manifest = JSON.parse(
      await fs.readFile(path.join(tempDir, 'manifest.json'), 'utf-8')
    ) as { icons: Array<{ src: string }> };
    expect(manifest.icons.map((icon) => icon.src)).toEqual(['/icon-192.png', '/icon-512.png']);
    await expect(fs.readFile(path.join(tempDir, 'sitemap.xml'), 'utf-8')).resolves.toContain(
      'https://example.com/'
    );
    await expect(fs.readFile(path.join(tempDir, 'robots.txt'), 'utf-8')).resolves.toContain(
      'https://example.com/sitemap.xml'
    );
  });
});
