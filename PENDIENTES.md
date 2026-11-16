# Pendientes

Mejoras opcionales e ideas guardadas al terminar el plan de 8 fases (15/11/2026). **Ninguna se empieza sin la autorización del dueño del proyecto.** Al hacer un punto, se quita de esta lista.

## Mejoras opcionales

1. **El selector de color se cierra solo.** Pasa si se abre "Color del pincel" en los 0,15 s en que se cierra el panel de pinceles. Al terminar de cerrarse, el panel devuelve el foco a su botón (`useReturnFocus` / `onCloseAutoFocus`) y eso cierra el globo. El arreglo es pequeño y no cambia nada visual.
2. **Exigir los checks de CI en `dev` y `main`.** Se hace en GitHub: _Settings → Branches_, _Require status checks to pass_.
3. **Dependabot también para los paquetes de npm.** Una vez al mes, agrupado, solo versiones de más de 14 días (`cooldown`) y con PRs a `dev`. Hoy solo actualiza las acciones del workflow.
4. **Al dejar Netlify**, en el nuevo hosting hace falta:
   - HTTPS;
   - `sw.js` e `index.html` sin caché larga;
   - caché `immutable` para `/assets/*`, que hoy hace `public/_headers`.

   Después se quitan `_headers` y las menciones a Netlify (README y comentario de `vite.config.js`).

5. **Actualizaciones de npm disponibles** (al 15/11/2026; antes de instalar, preguntar y elegir versiones publicadas hace más de 2 semanas):
   - lucide-react 1.62 → 1.73;
   - react-colorful 5.6.1 → 5.8.1;
   - eslint-plugin-react-refresh 0.5.7 → 0.5.8;
   - @playwright/test 1.64.1 → 1.65.x;
   - **TypeScript 6 → 7**, una versión mayor que necesita su propio plan.
6. **Avisos de `npm audit`.** Hay 12, todos de herramientas de desarrollo:
   - minimatch, que viene de typescript-eslint;
   - deepmerge, glob y @rollup/plugin-node-resolve, que vienen de workbox-build.

   Se revisan cuando salgan versiones corregidas. En lo que llega al navegador hay 0.

## Ideas de funciones nuevas

Cada una necesita un plan propio, aprobado antes de empezar:

- capas;
- filtros;
- más pinceles.
