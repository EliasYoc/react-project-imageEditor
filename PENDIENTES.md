# Pendientes

Mejoras opcionales e ideas guardadas al terminar el plan de 8 fases (15/11/2026). **Ninguna se empieza sin la autorización del dueño del proyecto.** Al hacer un punto, se quita de esta lista.

## Mejoras opcionales

1. **Exigir los checks de CI en `dev` y `main`.** Se hace en GitHub: _Settings → Branches_, _Require status checks to pass_.
2. **Dependabot también para los paquetes de npm.** Una vez al mes, agrupado, solo versiones de más de 14 días (`cooldown`) y con PRs a `dev`. Hoy solo actualiza las acciones del workflow.
3. **Actualizaciones de npm que aún no cumplen las 2 semanas** (al 15/11/2026; antes de instalar, preguntar):
   - lucide-react 1.66.0 → 1.73.0, a partir del 28/11;
   - eslint-plugin-react-refresh 0.5.7 → 0.5.8, a partir del 29/11;
   - @playwright/test 1.64.1 → 1.65.0 a partir del 19/11, o 1.65.1 a partir del 27/11;
   - mediabunny 1.65.0 → 1.66.0, a partir del 27/11;
   - **TypeScript 6 → 7**: una versión mayor, que necesita su propio plan.
4. **Avisos de `npm audit`.** Hay 12, todos de herramientas de desarrollo:
   - minimatch, que viene de typescript-eslint;
   - deepmerge, glob y @rollup/plugin-node-resolve, que vienen de workbox-build.

   Se revisan cuando salgan versiones corregidas. En lo que llega al navegador hay 0.

## Ideas de funciones nuevas

Cada una necesita un plan propio, aprobado antes de empezar:

- capas;
- filtros.

### Ideas para el video

Recomendadas al hacer la primera versión (abrir, reproducir y exportar, 17/11/2026), de menos a más trabajo:

1. **Guardar el fotograma actual como imagen.** Casi gratis: la exportación de imagen ya sabe componer un fotograma.
2. **Exportar sin sonido.** Una opción en el diálogo de exportar.
3. **Arrastrar o pegar un video en el inicio**, como una foto. Pequeño, pero cambia el texto del aviso al arrastrar.
4. **Elegir la resolución y la calidad** al exportar. Pequeño; el 4K necesita además trabajo de memoria.
5. **Recortar el inicio y el fin** (lo más útil de todo). Medio: mediabunny lo trae, pero empezar más tarde obliga a volver a codificar el sonido, y algunos navegadores (Firefox, Linux) no tienen codificador AAC.
6. **Videos de más de 2 minutos.** Medio: escribir el MP4 en disco mientras se exporta (OPFS) en lugar de en memoria.
7. **Girar o recortar el encuadre.** Medio: cambia el tamaño del documento.
8. **Filtros de color sobre el video** (ver "filtros"). De medio a grande: un filtro por fotograma, quizá con WebGL.
9. **Textos y dibujos con tiempo** (p. ej. un texto del segundo 3 al 8). Grande: cada elemento necesita su intervalo y hace falta una línea de tiempo.
