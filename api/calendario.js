// GET: el dueño lee su calendario completo. PUT: lo guarda.
import { leerCal, guardarCal, tokenOk, tokenDe, limpiar, json, error } from './_lib.js';

const sinSecreto = ({ tokenHash, ...d }) => d;

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const doc = await leerCal(id);
  if (!doc) return error('No existe', 404);
  if (!tokenOk(doc, tokenDe(req))) return error('Enlace de edición no válido', 403);
  return json(sinSecreto(doc));
}

export async function PUT(req) {
  const id = new URL(req.url).searchParams.get('id');
  const doc = await leerCal(id);
  if (!doc) return error('No existe', 404);
  if (!tokenOk(doc, tokenDe(req))) return error('Enlace de edición no válido', 403);
  const raw = await req.text();
  if (raw.length > 300_000) return error('Demasiado contenido', 413);
  let entrada; try { entrada = JSON.parse(raw); } catch { return error('JSON no válido'); }
  const nuevo = limpiar(entrada, doc);
  nuevo.editado = Date.now();
  await guardarCal(nuevo);
  return json({ ok: true, editado: nuevo.editado });
}
