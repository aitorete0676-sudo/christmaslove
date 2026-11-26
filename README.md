# Christmas Love

Calendario de adviento para tu pareja, pensado para el móvil. Cada persona crea el suyo, rellena los 24 días con fotos, mensajes y vídeos, y comparte un enlace. Cada ventana se abre sola en su día (1-24 de diciembre, hora de Madrid). El servidor no entrega el contenido de una ventana antes de su día.

## Páginas
- `/` inicio: crear calendario y "Mis calendarios" (recordados en el móvil).
- `/editar/<id>` editor (necesita el enlace de edición secreto `#t=...`).
- `/c/<id>` lo que ve ella. `/c/demo` ejemplo.

## API (`/api`)
- `POST /api/crear` → `{id, token}`
- `GET|PUT /api/calendario?id=` (cabecera `x-token`)
- `POST /api/archivo?id=` fotos (comprimidas en el móvil) y vídeos ≤ 4 MB → Vercel Blob
- `GET /api/ver?id=` solo ventanas abiertas (todo si va con `x-token` del dueño)

## Puesta en marcha en Vercel
1. Importa el repo en Vercel (Framework: Other).
2. Pestaña **Storage** → **Create** → **Upstash for Redis** (gratis) → conéctalo al proyecto.
3. Pestaña **Storage** → **Create** → **Blob** → conéctalo al proyecto.
4. **Deployments** → Redeploy.

## Local
`npm run dev` → http://localhost:3000. Sin variables de entorno guarda todo en `.data/`.
