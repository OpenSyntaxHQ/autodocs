const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 4173;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, '..', 'docs-dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', getContentType(filePath));
    res.end(data);
  });
}

function resolvePath(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') {
    pathname = '/index.html';
  }
  return path.join(ROOT, pathname);
}

console.log('Building test documentation...');
execSync('npm run docs:build', { stdio: 'inherit' });

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || '/');
  const accept = req.headers.accept || '';
  const dest = req.headers['sec-fetch-dest'];
  const isDocumentRequest = dest === 'document' || accept.includes('text/html');
  const isMarkdownRoute = (req.url || '').startsWith('/docs/');

  if (isDocumentRequest && isMarkdownRoute) {
    const indexPath = path.join(ROOT, 'index.html');
    sendFile(res, indexPath);
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback
    const indexPath = path.join(ROOT, 'index.html');
    sendFile(res, indexPath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Test server running on http://${HOST}:${PORT}`);
});
