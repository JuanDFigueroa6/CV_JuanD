# CreativeMedia - Local development

Instrucciones rápidas para trabajar con este repositorio localmente.

Requisitos (opcional):
- Node.js >= 14  (recomendado para `server.js` y utilidades)
- Python 3 (opcional, para `python -m http.server` si prefieres)

Arrancar servidor estático (elige uno):

  # Con Python 3
  python -m http.server 8000 --directory .

  # Con Node (requiere instalar http-server global o usar npx)
  npx http-server -p 8000

API de ejemplo para el formulario de contacto:

  # Ejecutar servidor Node.js interno (serve API):
  node server.js

  Esto iniciará un servidor en http://localhost:3000 con el endpoint POST /api/contact

Usar linters/formatters (opcional):

  # Instalar dependencias
  npm install

  # Formatear todo con Prettier
  npm run format

  # Ejecutar Stylelint para CSS
  npm run lint:css

Notas:
- `server.js` es un ejemplo mínimo que acepta JSON en POST /api/contact y devuelve un mensaje de confirmación.
- No instalar dependencias en este repo desde la UI del editor; ejecuta `npm install` localmente si deseas usar las herramientas.

## Build y despliegue (preparar `dist/` para hosting)

1. Instala dependencias de desarrollo (local):

  npm install

2. Genera la carpeta `dist/` con los archivos listos para subir:

  npm run build

  - El script copia HTML, CSS, JS y `assets/` a `dist/`.
  - Si tienes `uglify-js` y `clean-css-cli` instalados (están listados en devDependencies), el script intentará crear archivos minificados `.min.js` y `.min.css` en `dist/`.

3. Servir `dist/` localmente para comprobar:

  npm run serve:dist

4. Subir `dist/` a tu proveedor de hosting (Netlify, Vercel, GitHub Pages — sube `dist/` o configura la carpeta `public` según el servicio).

Notas de despliegue:
- Si usas GitHub Pages, sube los archivos del `dist/` a la rama `gh-pages` o configura el directorio `docs/`.
- Para hosts estáticos como Netlify, arrastra la carpeta `dist/` o conecta el repo y configura el build command `npm run build` y `publish` folder `dist/`.
