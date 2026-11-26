# Christmas Love

Calendario de adviento romántico: 24 ventanas con fotos, mensajes y vídeos que se abren solas del 1 al 24 de diciembre (hora de Madrid).

- `/` → **editor**: rellenas los 24 días sin tocar código y descargas tu calendario (`index.html` con todo dentro).
- `/calendario` → demo del calendario (plantilla + `contenido.js` de ejemplo).

## Publicar tu calendario
1. Rellena el editor y pulsa **Descargar**.
2. Mete el `index.html` en una carpeta y súbela a Vercel (vercel.com → Add New → Project → arrastra la carpeta) o a app.netlify.com/drop.
3. Mándale el enlace. Para verlo tú antes de tiempo añade `?prueba=<tu clave>` (aparece en el editor).

Tus fotos nunca se suben a este repositorio: se quedan en tu navegador y en tu archivo descargado.

## Desarrollo
Web estática, sin build. Vercel la publica tal cual.
- `index.html`: editor.
- `calendario.html`: plantilla del calendario. El editor la descarga y le inyecta los datos.
