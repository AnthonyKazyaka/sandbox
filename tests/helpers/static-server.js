// Minimal static file server for browser tests (no dependencies).
// Serves the repository under /sandbox/ to mirror the GitHub Pages layout
// (https://<user>.github.io/sandbox/...), so path bugs that only show up
// under a sub-path are reproduced locally.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASE_PATH = '/sandbox/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

export async function startStaticServer({ root = REPO_ROOT } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push(url.pathname);
    if (!url.pathname.startsWith(BASE_PATH)) {
      res.writeHead(404).end('Not found (outside /sandbox/)');
      return;
    }
    let rel = decodeURIComponent(url.pathname.slice(BASE_PATH.length));
    let file = path.join(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || file.includes(`${path.sep}node_modules${path.sep}`)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://localhost:${port}`,
    url: (p = '') => `http://localhost:${port}${BASE_PATH}${p}`,
    requests,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}
