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
| `npm run build`         | Build de producción en `build/` (la carpeta que publica Vercel)      |
| `npm run preview`       | Sirve el build de producción para probarlo                           |
| `npm test`              | Tests con Vitest (modo watch; `npx vitest run` para una sola pasada) |
| `npm run lint`          | ESLint                                                               |
| `npm run typecheck`     | Revisa los tipos de TypeScript                                       |
| `npm run check`         | Lint + tipos + tests (lo que debe pasar antes de abrir una PR)       |
| `npm run test:e2e`      | Tests de punta a punta con Playwright (ver [Tests e2e](#tests-e2e))  |
| `npm run test:e2e:ui`   | Igual, en la interfaz de Playwright: paso a paso y con capturas      |
| `npm run size`          | Presupuesto de tamaño del JS (después de `npm run build`)            |
| `npm run format`        | Formatea el código con Prettier                                      |

## Estructura

```
src/
  app/          Shell de la app: inicio + editor (EditorShell, que se carga bajo demanda)
  editor/       Núcleo del editor
    model/      Tipos del documento (TypeScript)
    store/      Store de Zustand: la única fuente de verdad del documento y su historial
    engine/     Motor puro, sin React ni nodos de Konva: vista, raster con checkpoints, puntero
      brushes/  Motor de pinceles: tinta (perfect-freehand), sellos, desenfoque, estabilizador, presets
    elements/   Textos e imágenes: fuentes, configuración de nodos de Konva, imán, caché de imágenes
    stage/      Lienzo con Konva (react-konva): capas, elementos, editor de texto y entrada del puntero
  features/     Una carpeta por función: home, editor-header, drawing, text, images, backdrop, export, shortcuts, zoom.
                Dentro, el código va por tipo (components/, hooks/, utils/, constants/), solo con las
                subcarpetas que tienen algo; los tests de la función quedan en su raíz
  components/   ui/: primitivas accesibles (Button, Panel, Dialog, Menu, Segmented, sliders, ColorControl, Tooltip…)
  styles/       tokens.css (colores, espacios, capas) y CSS global
  lib/          Utilidades puras
e2e/            Tests de punta a punta (Playwright) y sus imágenes de prueba (fixtures/)
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
- **Sellos** (Lápiz, Tiza, Aerógrafo, Spray, Resaltador, Caligrafía, Neón, Formas, Desenfoque y los borradores): se estampa una punta a lo largo del recorrido, con espaciado, flujo, dureza, curvas de presión y variación aleatoria. Las puntas se dibujan una vez por color y tamaño y se guardan (`tips.ts`): estampar es copiar una imagen.

Cada trazo se pinta primero en un **búfer** y luego se compone con su **opacidad** y su **modo de fusión**: un marcador semitransparente no se oscurece donde se cruza consigo mismo, pero sí sobre otro trazo. La variación aleatoria usa una **semilla** guardada en el trazo, así que se repinta siempre igual (al deshacer o al exportar). El **estabilizador** (una "cuerda" medida en píxeles de pantalla) se aplica al capturar los puntos.

Los presets están en `presets.ts`: cambiar uno cambia cómo se ven los trazos ya hechos.

El **resaltador** tiene su propia capa (`layers.ts`), entre el fondo y la pintura, que se **multiplica** con la foto (en el lienzo con `mix-blend-mode: multiply`; al exportar, con el mismo modo). Así tiñe la foto como un rotulador real en vez de verse como un color translúcido. Los borradores borran en todas las capas, y el resaltador queda siempre **debajo de la tinta**, aunque se pinte después (como al subrayar un texto impreso).

Tres de los pinceles de sellos tienen algo propio:

- **Formas** estampa figuras separadas (el espaciado es mayor que el tamaño): círculos, cuadrados, triángulos, estrellas o una mezcla. La figura se elige con el botón **⋮** de su tarjeta en la biblioteca y **se guarda en el trazo**; en la mezcla, la de cada sello sale de la semilla del sello. Por eso deshacer, rehacer y exportar repiten las mismas figuras.
- **Neón** es un halo del color del trazo con un núcleo blanco encima. El halo de un sello teñiría el núcleo de los anteriores, así que después de cada halo se repasa el núcleo de los últimos sellos. Se hace sello a sello: el trazo queda igual pintado en vivo, por partes, que repintado de una vez.
- **Desenfoque** no pinta con color: su forma es una máscara, y su opacidad, la intensidad.
  - **Qué desenfoca:** la foto, la capa de color y lo ya pintado, resaltador incluido. Los textos y las imágenes añadidas quedan nítidos (son otra capa). El borrador lo quita, y se puede seguir pintando encima.
  - **Cómo:** la pintura y el resaltador se desenfocan **en el sitio** al soltar el trazo (`paint.ts`). El fondo no es un raster de trazos, así que guarda una **máscara** y una copia desenfocada de sí mismo, y se muestra esa copia solo donde hay máscara (`editor/stage/backgroundBlur.ts`). Al cambiar el fondo se rehace la copia; los trazos no se repintan.
  - **Por qué es barato** (`blur.ts`): se desenfoca una **copia reducida** (hasta que el radio queda en 4 px) con el filtro `Blur` de Konva y se dibuja ampliada. El radio es un 2 % del lado corto, así que cuesta casi lo mismo en un lienzo pequeño que al exportar una foto de 12 MP, y se ve igual. Mientras se arrastra no se desenfoca nada: los sellos nuevos **revelan** una copia de todo lo visible que se desenfocó una vez, al empezar el trazo.
  - **Medido** en Edge, en un lienzo de 2048 × 2048: 0,4 ms por movimiento del puntero (igual que el Aerógrafo), 13 ms una vez al empezar el trazo y 17 ms una vez al soltarlo. No crea ningún canvas hasta que se usa por primera vez.

Al pulsar el botón del pincel activo se abre la **biblioteca**: los ajustes del pincel actual (tamaño, opacidad y estabilización; cada preset recuerda los suyos) y todos los presets con una **vista previa real**, pintada con el mismo motor que el lienzo, con el color y los ajustes actuales.

## Uso

| Acción                | Ratón / teclado                                                         | Pantalla táctil                     |
| --------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Dibujar               | Clic izquierdo y arrastrar                                              | Un dedo o el lápiz                  |
| Acercar / alejar      | Ctrl/⌘ + rueda (o pellizco del trackpad), Ctrl/⌘ + = / −                | Pellizcar con dos dedos             |
| Desplazar             | Rueda, espacio + arrastrar o botón central                              | Arrastrar con dos dedos             |
| Ajustar a la pantalla | Ctrl/⌘ + 0                                                              | Doble toque con dos dedos           |
| Deshacer / rehacer    | Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z (o Ctrl + Y)                            | Botones de la cabecera              |
| Editar un texto       | Doble clic, o clic en un texto ya seleccionado                          | Tocar un texto ya seleccionado      |
| Eliminar un elemento  | Supr / Retroceso (modo Texto)                                           | Botón de la papelera                |
| Negrita               | Ctrl/⌘ + B (modo Texto)                                                 | Panel "Fuente"                      |
| Pincel / borrador     | B / E (pulsa el botón activo para elegir otro preset)                   | Barra inferior                      |
| Figura de "Formas"    | Botón ⋮ de su tarjeta, en la biblioteca de pinceles                     | Igual                               |
| Tamaño del pincel     | [ / ], o el slider del borde izquierdo (se despliega al pasar el ratón) | Tocar el slider del borde izquierdo |
| Exportar              | Ctrl/⌘ + S o el botón "Exportar" (Enter en el diálogo)                  | Botón "Exportar"                    |
| Cerrar un panel       | Escape o ✕                                                              | ✕, tocar fuera o deslizar abajo     |
| Lista de atajos       | ? (o menú ⋮ → "Atajos de teclado")                                      | —                                   |
| Abrir una foto        | En el inicio: botón, arrastrarla a la ventana o Ctrl/⌘ + V              | Botón "Abrir una foto"              |

El zoom funciona en modo Dibujar y en modo Texto. En modo Texto, un dedo mueve el elemento y dos dedos hacen zoom. Al exportar desde el móvil se abre la hoja de "Compartir" del sistema.

## Inicio y avisos

- **Pantalla de inicio** (`features/home/components/HomeScreen.tsx`):
  - **Seguir editando**, si ya hay un documento;
  - **Abrir una foto**, con el botón, arrastrándola a la ventana o pegándola;
  - **Lienzo en blanco** en cuatro tamaños: Pantalla, Cuadrado 2048², Historia 1080×1920 y Horizontal 1920×1080.
- **Empezar otro documento** borra el actual y su historial (`newDocument` / `loadPhoto`). Si tenía algo, se pide confirmación antes.
- **Soltar un archivo** sobre la app nunca hace que el navegador lo abra (y se salga del editor).
- **Avisos** (`components/ui/Toast`, Radix Toast):
  - `toast.success(…)` y `toast.error(…)` desde cualquier parte;
  - se usan al descargar la imagen y cuando falla exportar o abrir una imagen.
- **Diálogos globales:** los que se abren desde un botón y un atajo (exportar y la lista de atajos) viven en `app/uiStore.ts`.

## Fondo (color y degradado)

- La **capa de color** (`backdrop` en el store) es parte del documento y del historial: se puede deshacer. Sin foto es el fondo del lienzo; con foto va **encima como un filtro**, con opacidad y modo de fusión, sin reemplazarla.
- Los degradados (lineal, radial y cónico) usan la **geometría de CSS** (`editor/engine/fill/`): el mismo ángulo y centro se ven igual que en `linear-gradient`, `radial-gradient` y `conic-gradient`. `paintFill` los pinta a cualquier resolución (lienzo, exportación, vistas previas).
- El editor (botón **Fondo** de la cabecera) aplica los cambios en vivo: paradas que se arrastran o se mueven con el teclado, dial de ángulo, centro arrastrable y presets.

## Textos

- **Fuentes propias** con [@fontsource](https://fontsource.org) (WOFF2), registradas en `editor/elements/fonts.ts`. Cada una se carga **bajo demanda** (import dinámico de su CSS) cuando un texto la usa o al abrir el selector, y solo se descarga el subconjunto latino: no hay peticiones a Google Fonts. Konva espera a que la fuente esté lista (`fontLoader.ts`) antes de medir el texto.
- **Estilos**: alineación, interlineado, degradado, contorno, sombra y caja de fondo. Las medidas se guardan en proporción al tamaño de letra, así que se mantienen al escalar el texto.
- **Degradado en el texto** (lineal o radial, `editor/elements/textGradient.ts`): se reparte en la caja del texto ya medida, sin el margen interior, y abarca todas las líneas, como `background-clip: text`. El radial es un círculo hasta la esquina más lejana, porque Konva no deforma el degradado en elipse y no tiene cónico para las formas.

## Rendimiento

- **El editor se carga bajo demanda** (`src/app/EditorShell.tsx`).
  - **Qué lleva:** todo lo que usa Konva (y el reconciliador de react-konva), en su propio archivo.
  - **El inicio** solo descarga el JS principal (~114 KB gzip; el motor de pinceles va con el editor) y, cuando el navegador está libre, **precarga el editor** en segundo plano.
  - **Con una red lenta**, si se entra antes de que llegue, se ve "Cargando el editor" un momento.
- **Caché:** los archivos de `/assets` llevan hash y Vercel los sirve con caché de un año (`headers` en `vercel.json`).
- **Medido en Edge** con el build de producción y la red limitada a 150 ms / 1,6 Mbps:

  |                      | Antes (un solo JS) | Después |
  | -------------------- | ------------------ | ------- |
  | JS del inicio (gzip) | 240 KB             | 118 KB  |
  | Primer pintado (FCP) | 1,95 s             | 1,30 s  |
  | Inicio usable        | 1,65 s             | 1,0 s   |

- **Dibujar** no tiene tareas largas ni con la CPU 4× más lenta (frames de ~7 ms, p95). El cuello de botella era la descarga, no la ejecución.

## PWA (instalable y sin conexión)

- **Plugin:** `vite-plugin-pwa` (configuración en `vite.config.js`) genera el `manifest.webmanifest` y el service worker (`sw.js`, con Workbox). El navegador ofrece instalar la app con su icono (`public/pwa-*.png`, `maskable-512x512.png`, `favicon.svg`).
- **Sin conexión:**
  - toda la app (también el editor, que se carga aparte) queda en caché al instalarse el service worker, unos 840 KB;
  - las **fuentes** se guardan la primera vez que se usan, o al abrir la lista de fuentes, y desde ahí también funcionan sin conexión.
- **Actualizaciones:** una versión nueva se descarga en segundo plano y **se usa la próxima vez que se abre la app**. Nunca recarga una pestaña abierta, porque el dibujo vive en memoria y se perdería.
- **Hosting (Vercel, configurado en `vercel.json`):**
  - hace falta **HTTPS** (en `localhost` funciona sin él); Vercel lo da siempre;
  - `sw.js` e `index.html` **no** deben tener caché larga, porque si no las versiones nuevas tardan en llegar. Vercel ya los sirve así por defecto (`max-age=0, must-revalidate`), por eso `vercel.json` solo cambia la caché de `/assets`;
  - `outputDirectory: "build"` hace falta porque Vercel busca `dist/` en los proyectos de Vite;
  - en otro hosting la app funciona igual, pero hay que repetir estas dos cosas en su configuración.

## Tests e2e

Los tests de `e2e/` usan la app como una persona, en un navegador real, con [Playwright](https://playwright.dev/) (configuración en `playwright.config.ts`).

- **Qué prueban:**
  - el inicio: los lienzos en blanco, abrir, soltar o pegar una foto y la confirmación antes de descartar;
  - el dibujo: el trazo, deshacer y rehacer, el slider de tamaño, el borrador, el resaltador sobre una foto y el zoom;
  - los pinceles: las figuras de Formas y su menú, y el Desenfoque sobre una foto y sobre la pintura (en pantalla y exportado);
  - los textos: escribir, editar, el degradado y moverlos;
  - el fondo de color y de degradado;
  - exportar: el nombre y el tamaño del PNG, y su contenido;
  - el teclado y la PWA sin conexión.
- **Contra el build de producción:** `npm run test:e2e` hace `npm run build` y lo sirve en el puerto 4180. Así se prueba lo mismo que se publica, con el service worker.
- **Dos pantallas:** escritorio (1280 × 800, ratón y teclado) y móvil (390 × 844, táctil). En el móvil los trazos y el pellizco son toques reales, y la hoja de compartir se cambia por una falsa que guarda el archivo.
- **Navegador:** el **Microsoft Edge** del equipo (`channel: "msedge"`), así que no hace falta `npx playwright install`.
- **Cómo se comprueba el lienzo:** leyendo los **píxeles** de capturas de pantalla y de la imagen exportada. Se decodifican en el propio navegador, sin librerías de imágenes.
- **Si un test falla:** Playwright guarda una traza (capturas, DOM y red de cada paso) en `test-results/`. Se abre con `npx playwright show-trace <ruta>/trace.zip`. El informe HTML queda en `playwright-report/`.

## CI (GitHub Actions)

En cada PR y cada push a `dev` y `main`, GitHub ejecuta `.github/workflows/ci.yml` en sus servidores (Ubuntu). En la PR aparecen dos comprobaciones con ✅ o ❌.

| Comprobación                             | Pasos                                                                           | Para repetirlo en local                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Formato, lint, tipos, tests y tamaño** | `npm ci` → formato → `npm run check` → build → presupuesto de tamaño            | `npm run format:check`, `npm run check`, `npm run build && npm run size` |
| **Tests e2e (Playwright)**               | Solo si la anterior pasa. Los e2e en el Edge del runner, con hasta 2 reintentos | `npm run test:e2e`                                                       |

- **Si sale ❌:** en la PR, _Details_ lleva a la ejecución; se abre el paso en rojo para ver su salida. Después se repite el comando en local.
  - **Formato:** `npm run format` lo arregla.
  - **e2e:** el informe con capturas y trazas está en _Artifacts → informe-playwright_. Se descomprime y se abre con `npx playwright show-report <carpeta>/playwright-report`.
  - **Si al repetirlo pasa, era "flaky":** un fallo intermitente que conviene investigar.
- **Por qué en Linux:** distingue mayúsculas en los nombres de archivo y Windows no. Un import `./button` hacia `Button.tsx` funciona en Windows y falla aquí, como fallaría en muchos servidores.
- **Presupuesto de tamaño** (`scripts/check-bundle-size.js`):
  - mide con gzip el JS del **inicio** (lo que enlaza `build/index.html`) y el del **editor** (el resto);
  - falla si pasan de **120 kB** y **140 kB**: hoy son unos 114 y 132;
  - si un cambio necesita más, se sube el límite en ese archivo, en la misma PR, explicando por qué.
- **Acciones fijadas por commit (SHA):** el comentario indica la versión (`# v7.0.1`). **Dependabot** (`.github/dependabot.yml`) abre una vez al mes una PR a `dev` para actualizarlas, solo con versiones de más de 14 días. Empieza a funcionar cuando el archivo llega a `main`.
- **Coste:** gratis en repos públicos. En privados, el plan gratuito incluye unos 2.000 minutos al mes, y cada ejecución tarda unos 5. Un push nuevo a la misma PR cancela la ejecución anterior.
- **Opcional:** en GitHub, _Settings → Branches → Add branch ruleset_ (o _branch protection rule_) para `dev` y `main`, con _Require status checks to pass_. Así no se puede fusionar una PR en rojo.

## Estilos

- Los valores de diseño (colores, espaciado, radios, z-index) viven en `src/styles/tokens.css` y se usan con `var(--…)`.
- Todo el CSS son **CSS Modules** (`*.module.css`) y tokens; no hay CSS en JS.
- Iconos de **lucide-react** (cada uno se importa por separado). Si falta uno, se crea con `createLucideIcon` y el mismo trazo (ver `features/drawing/constants/brushIcons.ts`).
- Para botones usa `Button` o `IconButton` de `components/ui/Button`: son `<button>` reales, accesibles con teclado. `IconButton` exige `aria-label` y acepta `shortcut` para su tooltip.
- Para valores numéricos usa `Slider` (un `<input type="range">` nativo con etiqueta y valor) y, en el borde del lienzo, `VerticalSlider` (barra al estilo de iOS, sin pulgar visible).

## Interfaz (Radix UI)

Las piezas interactivas de `components/ui` se apoyan en [Radix UI](https://www.radix-ui.com/) (paquete `radix-ui`), que resuelve el foco, el teclado y el ARIA:

- **`Panel`**: en el móvil es una **hoja inferior modal** (se cierra con ✕, Escape, tocando fuera o deslizándola hacia abajo); en escritorio (≥ 900 px) es un **panel lateral no modal**: el lienzo sigue a la vista y se puede dibujar o elegir otro texto con él abierto. Al cerrarse, el foco vuelve al botón que lo abrió (`useReturnFocus`).
- **`Dialog`** y **`ConfirmDialog`** (exportar, borrar el dibujo), **`Menu`** (⋮), **`ChoiceMenu`** (un menú para elegir una opción entre varias, con la elegida marcada: la figura del pincel Formas), **`Segmented`** (opciones excluyentes: un grupo de radio que se recorre con flechas) y **`ColorControl`** (globo en escritorio, hoja en el móvil, con campo hex).
- **`Tooltip`**: solo con ratón o teclado, con el atajo de cada botón. No aparece cuando un panel devuelve el foco a su botón.
- Los atajos de teclado no actúan sobre la selección (Supr, Escape) si el foco está dentro de un panel o un menú.

## Stack

React 19 · Vite · Konva (react-konva) · Zustand · TypeScript · Radix UI · lucide-react · CSS Modules · Vitest + Testing Library · Playwright · ESLint + Prettier
