// Servidor local que imita Vercel (estáticos + rewrites + /api). Uso: npm run dev
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd(), PORT = +process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let p = url.pathname;
  try {
    if (p.startsWith('/api/')) {
      const mod = await import(pathToFileURL(path.join(ROOT, 'api', p.slice(5).replace(/[^a-z]/g, '') + '.js')));
      const fn = mod[req.method];
      if (!fn) { res.writeHead(405).end(); return; }
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    if (p.startsWith('/dev-files/')) p = '/.data/files/' + path.basename(p);
    else if (/^\/c\/[^/]+$/.test(p)) p = '/c.html';
    else if (/^\/editar\/[^/]+$/.test(p)) p = '/editar.html';
    else if (p === '/') p = '/index.html';
    else if (!path.extname(p)) p += '.html';
    const f = path.join(ROOT, path.normalize(p));
    if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(f);
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(data);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error(e);
    res.writeHead(e.code === 'ENOENT' ? 404 : 500).end(e.code === 'ENOENT' ? 'No encontrado' : 'Error');
  }
}).listen(PORT, () => console.log(`Christmas Love en http://localhost:${PORT}`));
