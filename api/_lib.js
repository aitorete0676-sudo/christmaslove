// Utilidades compartidas por las funciones de /api (los archivos con _ no son rutas).
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_FOTOS_DIA = 6;
const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;
const DATA = path.join(process.cwd(), '.data');

/* ---------- almacenamiento de calendarios ----------
   Por defecto en Vercel Blob (gratis): un JSON por calendario en una ruta imposible de adivinar
   (cal/<id>/<hmac>.json, firmada con el token de Blob). Si hay Upstash Redis configurado, se usa Redis.
   Sin nada configurado (local), se guarda en .data/ */
const REDIS = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
const BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
let redis = null;
async function db() {
  if (redis) return redis;
  const { Redis } = await import('@upstash/redis');
  redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}
const rutaCal = id => `cal/${id}/${crypto.createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN).update(id).digest('hex').slice(0, 32)}.json`;
// El token tiene la forma vercel_blob_rw_<storeId>_<secreto>
let host = null;
const tienda = () => (process.env.BLOB_READ_WRITE_TOKEN.match(/^vercel_blob_rw_([^_]+)_/) || [])[1];
export async function leerCal(id) {
  if (!/^[a-z0-9]{8}$/.test(id || '')) return null;
  if (REDIS) {
    const d = await (await db()).get(`cal:${id}`);
    if (d || !BLOB) return d || null;
    // calendarios creados antes de conectar Redis: se leen de Blob y se pasan a Redis
    const viejo = await leerBlob(id).catch(() => null);
    if (viejo) await (await db()).set(`cal:${id}`, viejo);
    return viejo;
  }
  if (BLOB) return leerBlob(id);
  try { return JSON.parse(await fs.readFile(path.join(DATA, `cal-${id}.json`), 'utf8')); } catch { return null; }
}
async function leerBlob(id) {
  {
    let r = await fetch(`https://${host || tienda().toLowerCase() + '.public.blob.vercel-storage.com'}/${rutaCal(id)}?v=${Date.now()}`, { cache: 'no-store' });
    if (r.status === 404 && !host) {
      // por si la URL deducida no es la buena: preguntamos a Blob dónde está
      const { head } = await import('@vercel/blob');
      try { const h = await head(rutaCal(id)); host = new URL(h.url).host; r = await fetch(h.url + '?v=' + Date.now(), { cache: 'no-store' }); } catch { return null; }
    }
    if (r.status === 404 || r.status === 403) return null;
    if (!r.ok) throw new Error('Blob ' + r.status);
    return r.json();
  }
}
export async function guardarCal(doc) {
  if (REDIS) { await (await db()).set(`cal:${doc.id}`, doc); return; }
  if (BLOB) {
    const { put } = await import('@vercel/blob');
    const r = await put(rutaCal(doc.id), JSON.stringify(doc), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    host = new URL(r.url).host;
    return;
  }
  await fs.mkdir(DATA, { recursive: true }); await fs.writeFile(path.join(DATA, `cal-${doc.id}.json`), JSON.stringify(doc));
}

/* ---------- archivos (Vercel Blob o disco en local) ---------- */
export async function subirArchivo(nombre, buf, tipo) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const dir = path.join(DATA, 'files'); await fs.mkdir(dir, { recursive: true });
    const f = crypto.randomBytes(10).toString('hex') + path.extname(nombre);
    await fs.writeFile(path.join(dir, f), buf);
    return '/dev-files/' + f;
  }
  const { put } = await import('@vercel/blob');
  const r = await put(nombre, buf, { access: 'public', contentType: tipo, addRandomSuffix: true });
  return r.url;
}
export function urlPropia(u) {
  if (typeof u !== 'string' || u.length > 400) return false;
  if (u.startsWith('/dev-files/')) return LOCAL;
  try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.endsWith('.public.blob.vercel-storage.com'); } catch { return false; }
}

/* ---------- ids, tokens, fechas ---------- */
export const nuevoId = () => { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; return Array.from(crypto.randomBytes(8), b => a[b % a.length]).join(''); };
export const nuevoToken = () => crypto.randomBytes(24).toString('hex');
export const hash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
export function tokenOk(doc, t) {
  if (!doc || typeof t !== 'string' || !t) return false;
  const a = Buffer.from(doc.tokenHash, 'hex'), b = Buffer.from(hash(t), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function hoyMadrid() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = t => +p.find(x => x.type === t).value;
  return { y: g('year'), m: g('month'), d: g('day') };
}
export const abierta = (n, anio, h) => h.y > anio || (h.y === anio && h.m === 12 && h.d >= n);

/* ---------- validación del contenido ---------- */
const txt = (v, max) => (typeof v === 'string' ? v : '').slice(0, max);
function videoOk(v) {
  if (!v) return '';
  if (urlPropia(v)) return v;
  try { const u = new URL(v); if (u.protocol === 'https:' && /(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)) return v.slice(0, 300); } catch {}
  return '';
}
export function limpiar(entrada, previo) {
  const out = { para: txt(entrada.para, 40), de: txt(entrada.de, 40), pie: txt(entrada.pie, 80), dias: {} };
  for (let n = 1; n <= 24; n++) {
    const d = (entrada.dias && entrada.dias[n]) || {};
    out.dias[n] = {
      titulo: txt(d.titulo, 80),
      texto: txt(d.texto, 3000),
      fotos: (Array.isArray(d.fotos) ? d.fotos : []).filter(urlPropia).slice(0, MAX_FOTOS_DIA),
      video: videoOk(d.video),
    };
  }
  return Object.assign({}, previo, out);
}
export const vacio = () => Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, { titulo: '', texto: '', fotos: [], video: '' }]));

/* ---------- respuestas ---------- */
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export const error = (msg, status = 400) => json({ error: msg }, status);
export const tokenDe = req => req.headers.get('x-token') || '';
