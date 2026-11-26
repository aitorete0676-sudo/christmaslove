// POST ?id=...&tipo=foto|video  cuerpo = el archivo (ya comprimido en el móvil)
import { leerCal, tokenOk, tokenDe, subirArchivo, json, error } from './_lib.js';

const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm' };
const MAX = 4.3 * 1024 * 1024;

export async function POST(req) {
  const q = new URL(req.url).searchParams, id = q.get('id');
  const doc = await leerCal(id);
  if (!doc) return error('No existe', 404);
  if (!tokenOk(doc, tokenDe(req))) return error('Enlace de edición no válido', 403);
  const tipo = (req.headers.get('content-type') || '').split(';')[0].trim();
  if (!TIPOS[tipo]) return error('Formato no admitido', 415);
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return error('Archivo vacío');
  if (buf.length > MAX) return error('El archivo pesa más de 4 MB', 413);
  try {
    const url = await subirArchivo(`cal/${id}/${tipo.startsWith('video') ? 'video' : 'foto'}${TIPOS[tipo]}`, buf, tipo);
    return json({ url });
  } catch (e) { console.error(e); return error('No se pudo subir', 500); }
}
