# Editor de imágenes

Editor de imágenes en el navegador: dibuja con pinceles, añade texto e imágenes y aplica fondos degradados.

Producción: https://editoryoc.netlify.app/

<img width="1264" alt="Captura de pantalla 2023-01-29 a la(s) 17 31 29" src="https://user-images.githubusercontent.com/64809211/215362310-aefbfe15-f129-4357-8af3-e5865edf8f15.png">

## Requisitos

- Node.js 24 LTS (la versión está en `.nvmrc`). Con nvm-windows:

  ```sh
  nvm install 24
  nvm use 24
  ```

## Scripts

| Comando                 | Qué hace                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| `npm install`           | Instala las dependencias                                             |
| `npm run dev`           | Servidor de desarrollo en http://localhost:5173                      |
| `npm run dev -- --host` | Igual, pero accesible desde el móvil en la misma red                 |
| `npm run build`         | Build de producción en `build/` (la carpeta que publica Netlify)     |
| `npm run preview`       | Sirve el build de producción para probarlo                           |
| `npm test`              | Tests con Vitest (modo watch; `npx vitest run` para una sola pasada) |
| `npm run lint`          | ESLint                                                               |
| `npm run typecheck`     | Revisa los tipos de TypeScript                                       |
| `npm run check`         | Lint + tipos + tests (lo que debe pasar antes de abrir una PR)       |
| `npm run format`        | Formatea el código con Prettier                                      |

## Estructura

```
src/
  app/          Shell de la app (cabecera | lienzo | barra inferior)
  editor/       Núcleo del editor
    model/      Tipos del documento (TypeScript)
    store/      Store de Zustand: la única fuente de verdad del documento y su historial
    engine/     Motor puro, sin React ni Konva: vista, raster con checkpoints, puntero
      brushes/  Motor de pinceles: tinta (perfect-freehand), sellos, estabilizador, presets
    stage/      Lienzo con Konva (react-konva) y entrada del puntero
  features/     Una carpeta por función: home, editor-header, drawing, text, images, gradient, export
  components/   Piezas reutilizables: layout/ y ui/ (Button, IconButton…)
  styles/       tokens.css (colores, espacios, capas), CSS global y fuentes
  lib/          Utilidades puras
```

Las carpetas `legacy/` contienen código que se va a reemplazar (textos e imágenes con react-moveable y html2canvas, que pasan a Konva en la Fase 4): se tocan lo mínimo y sus avisos de hooks no bloquean el lint.

## Cómo funciona el lienzo

- Todo el dibujo se guarda en **coordenadas del documento** (píxeles de la imagen), nunca de la pantalla. `editor/engine/viewport.ts` convierte entre ambas.
- Un **trazo es un vector** (puntos con presión + pincel). La pantalla muestra un raster en caché (`PaintRaster`) que se pone al día solo cuando cambia el store; al exportar, los trazos se vuelven a pintar a la resolución de la foto original.
- **Deshacer/rehacer** guarda versiones del log (que es inmutable, así que solo copia referencias). El raster guarda una copia cada 20 trazos para no repintar todo al deshacer.
- La entrada usa **Pointer Events** (ratón, dedo y lápiz con el mismo código). `editor/stage/useStageInput.ts` decide si un puntero dibuja, desplaza o hace zoom.
- La **vista** (zoom y desplazamiento) vive en su propio store (`editor/stage/viewStore.ts`): no es parte del dibujo ni del historial.

## Pinceles

Hay dos motores en `editor/engine/brushes/`:

- **Tinta** (Pluma, Marcador): perfect-freehand calcula el contorno del trazo y se rellena. El grosor sigue la presión del lápiz o, con ratón y dedo, la velocidad.
- **Sellos** (Lápiz, Tiza, Aerógrafo, Spray, Resaltador, borradores): se estampa una punta a lo largo del recorrido, con espaciado, flujo, dureza, curvas de presión y variación aleatoria.

Cada trazo se pinta primero en un **búfer** y luego se compone con su **opacidad** y su **modo de fusión**: un marcador semitransparente no se oscurece donde se cruza consigo mismo, pero sí sobre otro trazo. La variación aleatoria usa una **semilla** guardada en el trazo, así que se repinta siempre igual (al deshacer o al exportar). El **estabilizador** (una "cuerda" medida en píxeles de pantalla) se aplica al capturar los puntos.

Los presets están en `presets.ts`: cambiar uno cambia cómo se ven los trazos ya hechos.

## Uso

| Acción                | Ratón / teclado                                          | Pantalla táctil           |
| --------------------- | -------------------------------------------------------- | ------------------------- |
| Dibujar               | Clic izquierdo y arrastrar                               | Un dedo o el lápiz        |
| Acercar / alejar      | Ctrl/⌘ + rueda (o pellizco del trackpad), Ctrl/⌘ + = / − | Pellizcar con dos dedos   |
| Desplazar             | Rueda, espacio + arrastrar o botón central               | Arrastrar con dos dedos   |
| Ajustar a la pantalla | Ctrl/⌘ + 0                                               | Doble toque con dos dedos |
| Deshacer / rehacer    | Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z (o Ctrl + Y)             | Botones de la cabecera    |
| Pincel / borrador     | B / E (pulsa el botón activo para elegir otro preset)    | Barra inferior            |
| Tamaño del pincel     | [ / ] (o el slider lateral)                              | Slider lateral            |

El zoom solo está en modo Dibujar: en modo Texto el lienzo se ve ajustado (los textos pasan a Konva en la Fase 4) y al volver a Dibujar se recupera el zoom. Al exportar desde el móvil se abre la hoja de "Compartir" del sistema.

## Estilos

- Los valores de diseño (colores, espaciado, radios, z-index) viven en `src/styles/tokens.css` y se usan con `var(--…)`.
- Los componentes nuevos usan **CSS Modules** (`*.module.css`). styled-components se va retirando a medida que se reconstruye cada parte.
- Para botones usa `Button` o `IconButton` de `components/ui/Button`: son `<button>` reales, accesibles con teclado. `IconButton` exige `aria-label`.

## Stack

React 19 · Vite · Konva (react-konva) · Zustand · TypeScript (gradual) · CSS Modules · styled-components (en retirada) · Vitest + Testing Library · ESLint + Prettier
