import { nuevoId, nuevoToken, hash, guardarCal, leerCal, vacio, hoyMadrid, json, error } from './_lib.js';

export async function POST() {
  try {
    let id = nuevoId();
    while (await leerCal(id)) id = nuevoId();
    const token = nuevoToken(), h = hoyMadrid();
    const anio = h.m === 12 && h.d > 24 ? h.y + 1 : h.y;
    await guardarCal({ id, tokenHash: hash(token), anio, creado: Date.now(), para: '', de: '', pie: 'Hecho con todo mi cariño', dias: vacio() });
    return json({ id, token });
  } catch (e) { console.error(e); return error('No se pudo crear el calendario', 500); }
}
