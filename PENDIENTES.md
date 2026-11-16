# Pendientes

Mejoras opcionales e ideas guardadas al terminar el plan de 8 fases (15/11/2026). **Ninguna se empieza sin la autorización del dueño del proyecto.** Al hacer un punto, se quita de esta lista.

## Mejoras opcionales

1. **Exigir los checks de CI en `dev` y `main`.** Se hace en GitHub: _Settings → Branches_, _Require status checks to pass_.
2. **Dependabot también para los paquetes de npm.** Una vez al mes, agrupado, solo versiones de más de 14 días (`cooldown`) y con PRs a `dev`. Hoy solo actualiza las acciones del workflow.
3. **Al dejar Netlify**, en el nuevo hosting hace falta:
   - HTTPS;
   - `sw.js` e `index.html` sin caché larga;
   - caché `immutable` para `/assets/*`, que hoy hace `public/_headers`.

   Después se quitan `_headers` y las menciones a Netlify (README y comentario de `vite.config.js`).

4. **Actualizaciones de npm que aún no cumplen las 2 semanas** (al 15/11/2026; antes de instalar, preguntar):
   - lucide-react 1.66.0 → 1.73.0, a partir del 28/11;
   - eslint-plugin-react-refresh 0.5.7 → 0.5.8, a partir del 29/11;
   - @playwright/test 1.64.1 → 1.65.0 a partir del 19/11, o 1.65.1 a partir del 27/11;
   - **TypeScript 6 → 7**: una versión mayor, que necesita su propio plan.
5. **Avisos de `npm audit`.** Hay 12, todos de herramientas de desarrollo:
   - minimatch, que viene de typescript-eslint;
   - deepmerge, glob y @rollup/plugin-node-resolve, que vienen de workbox-build.

   Se revisan cuando salgan versiones corregidas. En lo que llega al navegador hay 0.

## Ideas de funciones nuevas

Cada una necesita un plan propio, aprobado antes de empezar:

- capas;
- filtros.
