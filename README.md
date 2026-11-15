# Editor de imágenes

Editor de imágenes en el navegador: dibuja con pinceles, añade texto e imágenes y aplica colores o degradados de fondo (o encima de una foto, como un filtro).

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
    elements/   Textos e imágenes: fuentes, configuración de nodos de Konva, imán, caché de imágenes
    stage/      Lienzo con Konva (react-konva): capas, elementos, editor de texto y entrada del puntero
  features/     Una carpeta por función: home, editor-header, drawing, text, images, backdrop, export
  components/   ui/: primitivas accesibles (Button, Panel, Dialog, Menu, Segmented, sliders, ColorControl, Tooltip…)
  styles/       tokens.css (colores, espacios, capas) y CSS global
  lib/          Utilidades puras
```

## Cómo funciona el lienzo

- Todo el dibujo se guarda en **coordenadas del documento** (píxeles de la imagen), nunca de la pantalla. `editor/engine/viewport.ts` convierte entre ambas.
- Un **trazo es un vector** (puntos con presión + pincel). La pantalla muestra un raster en caché (`PaintRaster`) que se pone al día solo cuando cambia el store; al exportar, los trazos se vuelven a pintar a la resolución de la foto original.
- **Deshacer/rehacer** guarda versiones del log (que es inmutable, así que solo copia referencias). El raster guarda una copia cada 20 trazos para no repintar todo al deshacer.
- La entrada usa **Pointer Events** (ratón, dedo y lápiz con el mismo código). `editor/stage/useStageInput.ts` decide si un puntero dibuja, desplaza o hace zoom.
- Los **textos e imágenes** también son nodos de Konva en coordenadas del documento (posición, giro y escala). `editor/elements/nodeConfig.ts` traduce cada elemento a Konva; lo usan el lienzo y la exportación, así que lo que se ve es lo que se exporta (texto vectorial, nítido a la resolución de la foto). Mover, girar, escalar o cambiar el estilo de un elemento es un paso del historial.
- La **vista** (zoom y desplazamiento) vive en su propio store (`editor/stage/viewStore.ts`): no es parte del dibujo ni del historial.

## Pinceles

Hay dos motores en `editor/engine/brushes/`:

- **Tinta** (Pluma, Marcador): perfect-freehand calcula el contorno del trazo y se rellena. El grosor sigue la presión del lápiz o, con ratón y dedo, la velocidad.
- **Sellos** (Lápiz, Tiza, Aerógrafo, Spray, Resaltador, borradores): se estampa una punta a lo largo del recorrido, con espaciado, flujo, dureza, curvas de presión y variación aleatoria.

Cada trazo se pinta primero en un **búfer** y luego se compone con su **opacidad** y su **modo de fusión**: un marcador semitransparente no se oscurece donde se cruza consigo mismo, pero sí sobre otro trazo. La variación aleatoria usa una **semilla** guardada en el trazo, así que se repinta siempre igual (al deshacer o al exportar). El **estabilizador** (una "cuerda" medida en píxeles de pantalla) se aplica al capturar los puntos.

Los presets están en `presets.ts`: cambiar uno cambia cómo se ven los trazos ya hechos.

El **resaltador** tiene su propia capa (`layers.ts`), entre el fondo y la pintura, que se **multiplica** con la foto (en el lienzo con `mix-blend-mode: multiply`; al exportar, con el mismo modo). Así tiñe la foto como un rotulador real en vez de verse como un color translúcido. Los borradores borran en las dos capas, y el resaltador queda siempre **debajo de la tinta**, aunque se pinte después (como al subrayar un texto impreso).

Al pulsar el botón del pincel activo se abre la **biblioteca**: los ajustes del pincel actual (tamaño, opacidad y estabilización; cada preset recuerda los suyos) y todos los presets con una **vista previa real**, pintada con el mismo motor que el lienzo, con el color y los ajustes actuales.

## Uso

| Acción                | Ratón / teclado                                          | Pantalla táctil                 |
| --------------------- | -------------------------------------------------------- | ------------------------------- |
| Dibujar               | Clic izquierdo y arrastrar                               | Un dedo o el lápiz              |
| Acercar / alejar      | Ctrl/⌘ + rueda (o pellizco del trackpad), Ctrl/⌘ + = / − | Pellizcar con dos dedos         |
| Desplazar             | Rueda, espacio + arrastrar o botón central               | Arrastrar con dos dedos         |
| Ajustar a la pantalla | Ctrl/⌘ + 0                                               | Doble toque con dos dedos       |
| Deshacer / rehacer    | Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z (o Ctrl + Y)             | Botones de la cabecera          |
| Editar un texto       | Doble clic, o clic en un texto ya seleccionado           | Tocar un texto ya seleccionado  |
| Eliminar un elemento  | Supr / Retroceso (modo Texto)                            | Botón de la papelera            |
| Negrita               | Ctrl/⌘ + B (modo Texto)                                  | Panel "Fuente"                  |
| Pincel / borrador     | B / E (pulsa el botón activo para elegir otro preset)    | Barra inferior                  |
| Tamaño del pincel     | [ / ] (o el slider de la izquierda)                      | Slider de la izquierda          |
| Opacidad del pincel   | Slider de la izquierda                                   | Slider de la izquierda          |
| Exportar              | Botón "Exportar" de la cabecera (Enter en el diálogo)    | Botón "Exportar"                |
| Cerrar un panel       | Escape o ✕                                               | ✕, tocar fuera o deslizar abajo |

El zoom funciona en modo Dibujar y en modo Texto. En modo Texto, un dedo mueve el elemento y dos dedos hacen zoom. Al exportar desde el móvil se abre la hoja de "Compartir" del sistema.

## Fondo (color y degradado)

- La **capa de color** (`backdrop` en el store) es parte del documento y del historial: se puede deshacer. Sin foto es el fondo del lienzo; con foto va **encima como un filtro**, con opacidad y modo de fusión, sin reemplazarla.
- Los degradados (lineal, radial y cónico) usan la **geometría de CSS** (`editor/engine/fill/`): el mismo ángulo y centro se ven igual que en `linear-gradient`, `radial-gradient` y `conic-gradient`. `paintFill` los pinta a cualquier resolución (lienzo, exportación, vistas previas).
- El editor (botón **Fondo** de la cabecera) aplica los cambios en vivo: paradas que se arrastran o se mueven con el teclado, dial de ángulo, centro arrastrable y presets.

## Textos

- **Fuentes propias** con [@fontsource](https://fontsource.org) (WOFF2), registradas en `editor/elements/fonts.ts`. Cada una se carga **bajo demanda** (import dinámico de su CSS) cuando un texto la usa o al abrir el selector, y solo se descarga el subconjunto latino: no hay peticiones a Google Fonts. Konva espera a que la fuente esté lista (`fontLoader.ts`) antes de medir el texto.
- **Estilos**: alineación, interlineado, degradado, contorno, sombra y caja de fondo. Las medidas se guardan en proporción al tamaño de letra, así que se mantienen al escalar el texto.
- **Degradado en el texto** (lineal o radial, `editor/elements/textGradient.ts`): se reparte en la caja del texto ya medida, sin el margen interior, y abarca todas las líneas, como `background-clip: text`. El radial es un círculo hasta la esquina más lejana, porque Konva no deforma el degradado en elipse y no tiene cónico para las formas.

## Estilos

- Los valores de diseño (colores, espaciado, radios, z-index) viven en `src/styles/tokens.css` y se usan con `var(--…)`.
- Todo el CSS son **CSS Modules** (`*.module.css`) y tokens; no hay CSS en JS.
- Iconos de **lucide-react** (cada uno se importa por separado). Si falta uno, se crea con `createLucideIcon` y el mismo trazo (ver `features/drawing/brushIcons.ts`).
- Para botones usa `Button` o `IconButton` de `components/ui/Button`: son `<button>` reales, accesibles con teclado. `IconButton` exige `aria-label` y acepta `shortcut` para su tooltip.
- Para valores numéricos usa `Slider` (un `<input type="range">` nativo con etiqueta y valor) y, en los bordes del lienzo, `VerticalSlider`.

## Interfaz (Radix UI)

Las piezas interactivas de `components/ui` se apoyan en [Radix UI](https://www.radix-ui.com/) (paquete `radix-ui`), que resuelve el foco, el teclado y el ARIA:

- **`Panel`**: en el móvil es una **hoja inferior modal** (se cierra con ✕, Escape, tocando fuera o deslizándola hacia abajo); en escritorio (≥ 900 px) es un **panel lateral no modal**: el lienzo sigue a la vista y se puede dibujar o elegir otro texto con él abierto. Al cerrarse, el foco vuelve al botón que lo abrió (`useReturnFocus`).
- **`Dialog`** y **`ConfirmDialog`** (exportar, borrar el dibujo), **`Menu`** (⋮), **`Segmented`** (opciones excluyentes: un grupo de radio que se recorre con flechas) y **`ColorControl`** (globo en escritorio, hoja en el móvil, con campo hex).
- **`Tooltip`**: solo con ratón o teclado, con el atajo de cada botón. No aparece cuando un panel devuelve el foco a su botón.
- Los atajos de teclado no actúan sobre la selección (Supr, Escape) si el foco está dentro de un panel o un menú.

## Stack

React 19 · Vite · Konva (react-konva) · Zustand · TypeScript · Radix UI · lucide-react · CSS Modules · Vitest + Testing Library · ESLint + Prettier
