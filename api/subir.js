// Da permiso al móvil para subir un vídeo grande directamente a Vercel Blob (sin pasar por la función,
// que tiene un límite de 4,5 MB). El móvil manda {id, token} en clientPayload.
import { handleUpload } from '@vercel/blob/client';
import { leerCal, tokenOk, json, error } from './_lib.js';

export const MAX_VIDEO_MB = 150;

export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return error('Subida directa no disponible en local', 501);
  let body; try { body = await req.json(); } catch { return error('JSON no válido'); }
  try {
    const r = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let p = {}; try { p = JSON.parse(clientPayload || '{}'); } catch {}
        const doc = await leerCal(p.id);
        if (!doc || !tokenOk(doc, p.token)) throw new Error('Enlace de edición no válido');
        if (!pathname.startsWith(`cal/${p.id}/`)) throw new Error('Ruta no válida');
        return { allowedContentTypes: ['video/*'], maximumSizeInBytes: MAX_VIDEO_MB * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return json(r);
  } catch (e) { return error(e.message || 'No se pudo autorizar la subida', 400); }
}
