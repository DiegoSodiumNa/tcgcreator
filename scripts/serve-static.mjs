// Local preview of exported files; no Next runtime or fallback to an SPA index.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath) {
      if (pathname === basePath) { res.writeHead(308, { Location: basePath + '/' }).end(); return; }
      if (!pathname.startsWith(basePath + '/')) { res.writeHead(404).end('Not found'); return; }
      pathname = pathname.slice(basePath.length);
    }
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => {
  console.log(`Static preview: http://127.0.0.1:4173${basePath}/`);
  process.send?.('ready');
});
