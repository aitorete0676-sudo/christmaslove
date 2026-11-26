// Lo que ve la novia: solo el contenido de las ventanas ya abiertas.
// Con ?id=demo devuelve un ejemplo. Con cabecera x-token (dueño) devuelve todo para la vista previa.
import { leerCal, tokenOk, tokenDe, hoyMadrid, abierta, json, error } from './_lib.js';

const DEMO = {
  para: 'mi amor', de: 'Tu nombre', pie: 'Así lo verá ella', anio: 2026,
  dias: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, {
    titulo: ['Empieza la cuenta atrás', 'Nuestra primera foto', 'Una canción para ti', 'Vale por un desayuno'][i % 4] ,
    texto: 'Aquí va tu mensaje del día ' + (i + 1) + '.\nPuedes añadir fotos y vídeos.', fotos: i === 0 ? ['/logos/LOGO-FINAL.png'] : [], video: '' }])),
};

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const h = hoyMadrid();
  if (id === 'demo') return json({ ...DEMO, hoy: h, todo: true, abiertas: Array.from({ length: 24 }, (_, i) => i + 1) });
  const doc = await leerCal(id);
  if (!doc) return error('Este calendario no existe', 404);
  const dueno = tokenOk(doc, tokenDe(req));
  const dias = {}, abiertas = [];
  for (let n = 1; n <= 24; n++) {
    if (dueno || abierta(n, doc.anio, h)) { dias[n] = doc.dias[n]; abiertas.push(n); }
  }
  return json({ para: doc.para, de: doc.de, pie: doc.pie, anio: doc.anio, hoy: h, todo: dueno, abiertas, dias });
}
