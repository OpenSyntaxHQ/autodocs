import fs from 'fs/promises';
import path from 'path';

export interface StaticSiteOptions {
  outputDir: string;
  siteUrl?: string;
  siteName: string;
}

export async function generateStaticSite(options: StaticSiteOptions): Promise<void> {
  await fs.mkdir(options.outputDir, { recursive: true });

  await fs.writeFile(path.join(options.outputDir, '.nojekyll'), '', 'utf-8');
  await generateManifest(options);

  if (!options.siteUrl) {
    console.warn('[autodocs] SITE_URL not set; skipping sitemap.xml and robots.txt');
    return;
  }

  const baseUrl = normalizeUrl(options.siteUrl);
  await generateSitemap(options.outputDir, baseUrl);
  await generateRobotsTxt(options.outputDir, baseUrl);
}

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

async function generateSitemap(outputDir: string, baseUrl: string): Promise<void> {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  await fs.writeFile(path.join(outputDir, 'sitemap.xml'), sitemap, 'utf-8');
}

async function generateRobotsTxt(outputDir: string, baseUrl: string): Promise<void> {
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  await fs.writeFile(path.join(outputDir, 'robots.txt'), robots, 'utf-8');
}

async function generateManifest(options: StaticSiteOptions): Promise<void> {
  const icons = await resolveIcons(options.outputDir);
  const manifest = {
    name: options.siteName,
    short_name: options.siteName,
    description: 'API Documentation',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons,
  };

  await fs.writeFile(
    path.join(options.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
}

async function resolveIcons(
  outputDir: string
): Promise<Array<{ src: string; sizes: string; type: string }>> {
  const icons: Array<{ src: string; sizes: string; type: string }> = [];

  const icon192 = path.join(outputDir, 'icon-192.png');
  const icon512 = path.join(outputDir, 'icon-512.png');

  if (await fileExists(icon192)) {
    icons.push({ src: '/icon-192.png', sizes: '192x192', type: 'image/png' });
  }

  if (await fileExists(icon512)) {
    icons.push({ src: '/icon-512.png', sizes: '512x512', type: 'image/png' });
  }

  return icons;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
