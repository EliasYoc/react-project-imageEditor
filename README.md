# Editor de imágenes

Editor de imágenes en el navegador: dibuja con pinceles, añade texto e imágenes y aplica colores o degradados de fondo (o encima de una foto, como un filtro).

Producción: https://editoryoc.vercel.app/

<img width="1264" alt="Captura de pantalla 2023-01-29 a la(s) 17 31 29" src="https://user-images.githubusercontent.com/64809211/215362310-aefbfe15-f129-4357-8af3-e5865edf8f15.png">

## Requisitos

- Node.js 24 LTS (la versión está en `.nvmrc`). Con nvm-windows:

  ```sh
  nvm install 24
  nvm use 24
  ```

## Scripts

| Comando                 | Qué hace                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm install`           | Instala las dependencias                                                 |
| `npm run dev`           | Servidor de desarrollo en http://localhost:5173                          |
| `npm run dev -- --host` | Igual, pero accesible desde el móvil en la misma red                     |
| `npm run build`         | Build de producción en `build/` (la carpeta que publica Vercel)          |
| `npm run preview`       | Sirve el build de producción para probarlo                               |
| `npm test`              | Tests con Vitest (modo watch; `npx vitest run` para una sola pasada)     |
| `npm run lint`          | ESLint                                                                   |
| `npm run typecheck`     | Revisa los tipos de TypeScript                                           |
| `npm run check`         | Formato + lint + tipos + tests (lo que debe pasar antes de abrir una PR) |
| `npm run test:e2e`      | Tests de punta a punta con Playwright (ver [Tests e2e](#tests-e2e))      |
| `npm run test:e2e:ui`   | Igual, en la interfaz de Playwright: paso a paso y con capturas          |
| `npm run size`          | Presupuesto de tamaño del JS (después de `npm run build`)                |
| `npm run format`        | Formatea el código con Prettier                                          |

## Estructura

```
src/
  app/          Shell de la app: inicio + editor (EditorShell, que se carga bajo demanda)
  editor/       Núcleo del editor
    model/      Tipos del documento (TypeScript)
    store/      Store de Zustand: la única fuente de verdad del documento y su historial
    engine/     Motor puro, sin React ni nodos de Konva: vista, raster con checkpoints, puntero
      brushes/  Motor de pinceles: tinta (perfect-freehand), sellos, desenfoque, estabilizador, presets
    elements/   Textos e imágenes: fuentes, configuración de nodos de Konva, imán, caché de imágenes, GIFs animados
    stage/      Lienzo con Konva (react-konva): capas, elementos, editor de texto y entrada del puntero
  features/     Una carpeta por función: home, editor-header, drawing, text, images, backdrop, export, shortcuts, update, video, view.
                Dentro, el código va por tipo (components/, hooks/, utils/, constants/), solo con las
                subcarpetas que tienen algo; con varios componentes, cada uno va en su carpeta con su CSS; los tests
                de la función quedan en su raíz
  components/   ui/: primitivas accesibles (Button, Panel, Dialog, Menu, Segmented, CardSection, AngleDial, GradientStopsBar, ColorField, ProgressBar, ToggleSection, Kbd, SliderBar, sliders, ColorControl, Tooltip…)
  styles/       tokens.css (colores, espacios, capas) y CSS global
  lib/          Utilidades puras
e2e/            Tests de punta a punta (Playwright) y sus archivos de prueba (fixtures/)
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
  - **Cómo:** la pintura y el resaltador se desenfocan **en el sitio** al soltar el trazo (`paint.ts`). El fondo no es un raster de trazos, así que guarda una **máscara** y una copia desenfocada de sí mismo, y se muestra esa copia solo donde hay máscara (`editor/stage/backgroundBlur.ts`). Al cambiar el fondo se rehace la copia; los trazos no se repintan. Con un video de fondo, eso pasa en cada fotograma (ver [Video](#video)).
  - **Por qué es barato** (`blur.ts`): se desenfoca una **copia reducida** (hasta que el radio queda en 4 px) con el filtro `Blur` de Konva y se dibuja ampliada. El radio es un 2 % del lado corto, así que cuesta casi lo mismo en un lienzo pequeño que al exportar una foto de 12 MP, y se ve igual. Mientras se arrastra no se desenfoca nada: los sellos nuevos **revelan** una copia de todo lo visible que se desenfocó una vez, al empezar el trazo.
  - **Medido** en Edge, en un lienzo de 2048 × 2048: 0,4 ms por movimiento del puntero (igual que el Aerógrafo), 13 ms una vez al empezar el trazo y 17 ms una vez al soltarlo. No crea ningún canvas hasta que se usa por primera vez.

Al pulsar el botón del pincel activo se abre la **biblioteca**: los ajustes del pincel actual (tamaño, opacidad y estabilización; cada preset recuerda los suyos) y todos los presets con una **vista previa real**, pintada con el mismo motor que el lienzo, con el color y los ajustes actuales.

## Uso

| Acción                       | Ratón / teclado                                                                       | Pantalla táctil                       |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| Dibujar                      | Clic izquierdo y arrastrar                                                            | Un dedo o el lápiz                    |
| Acercar / alejar             | Ctrl/⌘ + rueda (o pellizco del trackpad), Ctrl/⌘ + = / −, o menú …                    | Pellizcar con dos dedos o menú …      |
| Desplazar                    | Rueda, espacio + arrastrar o botón central                                            | Arrastrar con dos dedos               |
| Ajustar a la pantalla        | Ctrl/⌘ + 0 o menú … → "Ajustar a la pantalla"                                         | Doble toque con dos dedos o menú …    |
| Ocultar las barras           | O (otra vez para mostrarlas), o el botón del ojo junto al menú … (abajo a la derecha) | Botón del ojo junto al menú …         |
| Deshacer / rehacer           | Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z (o Ctrl + Y)                                          | Botones de la cabecera                |
| Agrandar y girar un elemento | Asas del marco de selección (modo Texto)                                              | Pellizcar el elemento ya seleccionado |
| Editar un texto              | Doble clic, o clic en un texto ya seleccionado                                        | Tocar un texto ya seleccionado        |
| Eliminar un elemento         | Supr / Retroceso (modo Texto)                                                         | Botón de la papelera                  |
| Negrita                      | Ctrl/⌘ + B (modo Texto)                                                               | Panel "Fuente y estilo"               |
| Pincel / borrador            | B / E (pulsa el botón activo para elegir otro preset)                                 | Barra inferior                        |
| Figura de "Formas"           | Botón ⋮ de su tarjeta, en la biblioteca de pinceles                                   | Igual                                 |
| Tamaño del pincel            | [ / ], o el slider del borde izquierdo (se despliega al pasar el ratón)               | Tocar el slider del borde izquierdo   |
| Exportar                     | Ctrl/⌘ + S o menú ⋮ → "Exportar" (Enter en el diálogo)                                | Menú ⋮ → "Exportar"                   |
| Volver al inicio             | Menú ⋮ → "Volver al inicio" (el dibujo se conserva)                                   | Igual                                 |
| Borrar el dibujo             | Menú ⋮ → "Borrar el dibujo" (se puede deshacer)                                       | Igual                                 |
| Borrar todo                  | Menú ⋮ → "Borrar todo definitivamente" (también el color de fondo; no se deshace)     | Igual                                 |
| Cerrar un panel              | Escape o ✕                                                                            | ✕, tocar fuera o deslizar abajo       |
| Lista de atajos              | ? (o menú ⋮ → "Atajos de teclado")                                                    | —                                     |
| Abrir una foto               | En el inicio: botón, arrastrarla a la ventana o Ctrl/⌘ + V                            | Botón "Abrir una foto"                |
| Abrir un video               | En el inicio: botón "Agregar video"                                                   | Igual                                 |
| Reproducir / pausar          | K, o el botón de la barra de reproducción (encima de las herramientas)                | Botón de la barra de reproducción     |
| Ir a otro momento            | Arrastrar la barra de tiempo, o con el foco en ella: flechas, Inicio y Fin            | Arrastrar la barra de tiempo          |

El zoom funciona en modo Dibujar y en modo Texto. En modo Texto, un dedo mueve el elemento y dos dedos hacen zoom. Al exportar desde el móvil se abre la hoja de "Compartir" del sistema. Con un video abierto, Exportar guarda el video en MP4 (ver [Video](#video)).

## Inicio y avisos

- **Pantalla de inicio** (`features/home/components/HomeScreen.tsx`):
  - **Seguir editando**, si ya hay un documento;
  - **Abrir una foto**, con el botón, arrastrándola a la ventana o pegándola;
  - **Agregar video**, con el botón (ver [Video](#video));
  - **Lienzo en blanco** en tres tamaños: Pantalla, Historia 1080×1920 y Horizontal 1920×1080.
  - **Lienzos por red social**, una sección cada una (`home/constants/canvasPresets.ts`): Instagram, Facebook, WhatsApp, Telegram, X y YouTube. Cada título lleva el logo de la red (`home/constants/networkIcons.ts`: trazados de simple-icons, licencia CC0, sin instalar nada). Ningún tamaño se repite en el inicio (un test lo vigila): las historias y el estado usan «Historia».
- **Empezar otro documento** borra el actual y su historial (`newDocument` / `loadPhoto`). Si tenía algo (un dibujo, una foto, un video o un fondo), se pide confirmación antes.
- **Soltar un archivo** sobre la app nunca hace que el navegador lo abra (y se salga del editor).
- **Avisos** (`components/ui/Toast`, Radix Toast):
  - `toast.success(…)` y `toast.error(…)` desde cualquier parte;
  - se usan al descargar la imagen y cuando falla exportar o abrir una imagen o un video.
- **Diálogos globales:** los que se abren desde un botón y un atajo (exportar y la lista de atajos) viven en `app/uiStore.ts`.

## Video

Un video se abre como **fondo del documento**, igual que una foto: se dibuja, se escribe y se ponen fondos encima, y esos cambios se ven durante todo el video.

- **Abrirlo** (`features/home/utils/openVideoFile.ts`): el archivo se lee con un `<video>` que no está en la página, desde una URL de objeto. Así no se carga entero en memoria. Queda en pausa en su primer fotograma.
- **Límites**, comprobados al abrir (con un aviso que dice el motivo):
  - hasta **2 minutos**: el video exportado se arma en memoria, unos 47 MB por minuto en Full HD;
  - el documento mide lo que el video, hasta **1920 px** de lado mayor (Full HD) y con los lados pares, que es lo que admite el códec H.264. Ese es también el tamaño al exportar;
  - el navegador tiene que tener **WebCodecs** (Edge, Chrome, Safari 16.4 o posterior y Firefox de escritorio): sin él no se podría exportar, y es mejor saberlo antes de editar.
- **En el store** va en `photo.video` (el elemento, el archivo, su URL y la duración), fuera del historial como la foto. Al empezar otro documento se suelta: deja de reproducirse y se libera la URL (`editor/store/videoLifecycle.ts`). Al volver al inicio se pausa.
- **En el lienzo**, la capa de fondo es una imagen de Konva cuyo origen es el `<video>`: pinta su fotograma actual. La capa de color, el resaltador y el desenfoque lo tratan como a una foto.
- **Seguir los fotogramas** (`editor/stage/videoFrames.ts`): la capa de fondo se repinta con `requestVideoFrameCallback`, que avisa una vez por fotograma del video (no por cada frame de la pantalla) y nada en pausa. Donde no existe se usa `requestAnimationFrame` mientras se reproduce.
- **Barra de reproducción** (`features/video`), encima de las herramientas y solo con un video abierto: reproducir o pausar (también con **K**; Espacio ya sirve para desplazar la vista), el tiempo, la barra de tiempo y silenciar.
  - Su estado se lee del propio `<video>` (`useVideoPlayback`, con `useSyncExternalStore`): no hay un store con una copia que pueda quedarse atrás.
  - La barra de tiempo es un slider de Radix, así que funciona con el dedo, el ratón y el teclado. Al arrastrarla se pide un salto cada vez, y solo el último destino (`createSeeker`): cada salto tarda en decodificarse.
- **Desenfoque sobre un video:** el fondo cambia en cada fotograma, así que su copia desenfocada se rehace en cada uno (solo si hay trazos de desenfoque, y solo mientras se reproduce). Empezar un trazo de desenfoque **pausa** el video: el trazo en curso muestra una copia de un instante.
- **Exportar** (menú ⋮ → "Exportar", o Ctrl/⌘ + S) guarda el video en **MP4**, del tamaño del documento, con el dibujo encima durante todo el video y con su sonido.
  - **Cómo** (`features/export/utils/exportVideo.ts` y `encodeVideo.ts`): con [mediabunny](https://mediabunny.dev), que lee el archivo original, decodifica y vuelve a codificar con **WebCodecs** (el codificador del propio navegador, normalmente por hardware) y escribe el MP4. Va tan rápido como el equipo pueda, no a la velocidad del video, y pasa por todos los fotogramas con sus tiempos originales.
  - **Cada fotograma** se compone como una imagen exportada (`documentCompositor.ts`): lo fijo (trazos, textos, imágenes, capa de color) se pinta una sola vez, y por fotograma solo se repite lo que depende del fondo (la capa de color encima, su desenfoque y el resaltador multiplicado). Si hay GIFs, también los textos e imágenes, con el fotograma de ese momento (ver [GIFs animados](#gifs-animados)).
  - **Sonido:** se copia tal cual cuando el MP4 admite su códec (AAC, el de casi todos los teléfonos); si no se pudiera conservar, el video sale sin sonido y se avisa.
  - **Giro:** los videos de teléfono suelen guardarse tumbados, con una nota de "girar 90°". Se ven y se exportan derechos, y el MP4 no lleva esa nota.
  - **El diálogo** se queda abierto con el avance y un botón para **cancelar**; mientras tanto no se cierra con Escape ni tocando fuera, la pantalla no se apaga (`navigator.wakeLock`) y los atajos de teclado no actúan.
  - **En el móvil** se abre la hoja de "Compartir", que exige un toque reciente. Si la exportación tardó más, el diálogo muestra "El video está listo" y un botón **Compartir o guardar**.
  - **Medido** en Edge (escritorio), un Full HD de 10 s: 2,7 s en exportarse; con un trazo de desenfoque, 3,7 s. Reproducir con desenfoque no produce tareas largas (más de 50 ms).
  - **Peso:** mediabunny va en su propio archivo de JavaScript (~111 kB con gzip), que solo se descarga al exportar un video. El diálogo de exportar un video (~2 kB) también va aparte.

## Fondo (color y degradado)

- La **capa de color** (`backdrop` en el store) es parte del documento y del historial: se puede deshacer. Sin foto ni video es el fondo del lienzo; con uno de ellos va **encima como un filtro**, con opacidad y modo de fusión, sin reemplazarlo.
- Los degradados (lineal, radial y cónico) usan la **geometría de CSS** (`editor/engine/fill/`): el mismo ángulo y centro se ven igual que en `linear-gradient`, `radial-gradient` y `conic-gradient`. `paintFill` los pinta a cualquier resolución (lienzo, exportación, vistas previas).
- El editor (botón **Fondo** de la cabecera) aplica los cambios en vivo: paradas que se arrastran o se mueven con el teclado, dial de ángulo, centro arrastrable y presets.

## Textos

- **Fuentes propias** con [@fontsource](https://fontsource.org) (WOFF2), registradas en `editor/elements/fonts.ts`. Cada una se carga **bajo demanda** (import dinámico de su CSS) cuando un texto la usa o al abrir el selector, y solo se descarga el subconjunto latino: no hay peticiones a Google Fonts. Konva espera a que la fuente esté lista (`fontLoader.ts`) antes de medir el texto.
- **Estilos**: grosor, alineación, interlineado, degradado, contorno, sombra y caja de fondo, todos en un solo panel («Fuente y estilo») junto con la lista de fuentes. Un texto nuevo es negro sobre una caja blanca semitransparente, que se lee sobre cualquier foto. Mientras se escribe, una capa oscurece el lienzo (clara si el texto, sin caja, solo se lee sobre claro). Las medidas se guardan en proporción al tamaño de letra, así que se mantienen al escalar el texto.
- **Escribir un texto** (`TextEditorOverlay`, `editor/elements/textEditorBox.ts`): mientras se edita, el texto del lienzo y su marco se ocultan y el editor no se pone encima: sale **horizontal, centrado en la zona libre del lienzo y un poco por encima del centro** (a un 40 % del alto libre), aunque el texto esté girado o lejos; así se lee, también con el teclado del móvil abierto. Mide en pantalla lo mismo que el texto del lienzo y solo se encoge si es más ancho que la zona libre. No toca el documento: al terminar, el texto sigue donde estaba, con su giro. Un texto **recién escrito** es la excepción: se queda donde estaba el editor (`newTextPosition`, que se guarda en el mismo cambio que el texto, sin añadir un paso al historial) y no donde se creó, para que no salte al terminar.
- **Ancho máximo** (`editor/elements/textWidth.ts`): un texto de ancho automático crece con lo que se escribe hasta el **90 % del ancho del lienzo** (`maxTextWidth`) y desde ahí se reparte en líneas. No se guarda ningún ancho: el texto sigue con `width: null` y el tope se aplica al dibujarlo (`applyTextMaxWidth`: lienzo, exportación y vista previa, que comparten `createTextLabel`) y en el editor (`white-space: pre-wrap` desde el máximo), así que si se acorta vuelve a encogerse. Un texto con un ancho fijado con las asas laterales conserva el suyo.
- **Vista previa del texto**: arriba del panel «Fuente y estilo», fija mientras se hace scroll, se ve el texto real (las 3 primeras líneas, encogido si no cabe) con su estilo. Es un lienzo pequeño de Konva que se crea con `createTextLabel` (`editor/elements/textShape.ts`), la misma función que usa la exportación sobre `textNodeConfig`, así que el contorno, la sombra, el degradado y la caja se ven igual que en el lienzo. No representa el documento: el fondo es blanco o, si los colores del texto (relleno o caja, y contorno) se ven mejor sobre gris oscuro, gris oscuro; la sombra no cuenta.
- **Degradado en el texto** (lineal o radial, `editor/elements/textGradient.ts`): se reparte en la caja del texto ya medida, sin el margen interior, y abarca todas las líneas, como `background-clip: text`. El radial es un círculo hasta la esquina más lejana, porque Konva no deforma el degradado en elipse y no tiene cónico para las formas.

## GIFs animados

Un GIF se inserta como cualquier imagen (modo Texto → **Más opciones** → «Insertar archivo») y **se mueve** en el lienzo, la foto o el video. También los WebP y PNG animados.

- **Decodificar** (`editor/elements/animatedImage.ts`): con `ImageDecoder` (WebCodecs, del propio navegador; Edge, Chrome y Firefox 133 o posterior). Un canvas solo sabe pintar el primer fotograma de un GIF, así que cada fotograma se decodifica, se pinta en un canvas propio de la imagen, y ese canvas es el que pinta Konva.
- **Memoria:** nunca se abren todos los fotogramas a la vez (un GIF de 480 × 270 con 50 fotogramas serían unos 26 MB). Se guarda el archivo comprimido y un solo canvas; cada fotograma se decodifica al necesitarlo y se suelta enseguida. Dos elementos con el mismo GIF comparten ambos.
- **Si es animada** se mira una vez, al insertarla (`animation` del elemento: `"none"`, `"frames"` para un GIF o `"lottie"` para un sticker). Las animaciones se abren una vez por archivo (`editor/elements/imageAnimations.ts`).
- **El mismo archivo, la misma animación:** al insertar, se calcula una huella del contenido (SHA-256) y, si ese archivo ya estaba, se reutiliza su URL (`features/images/utils/objectUrlFor.ts`). Así 30 copias de un GIF o de un sticker se pintan una sola vez por fotograma. Sin HTTPS no hay `crypto.subtle` y cada inserción lleva su URL.
- **El tiempo** (`editor/stage/animationClock.ts`): con un video de fondo, el del video (los GIFs se paran en pausa y saltan con la barra de tiempo, como saldrán al exportar); si no, el reloj de la página. El fotograma de cada momento sale de su línea de tiempo (`animationTimeline.ts`): los fotogramas de 10 ms o menos duran 100 ms, como en `<img>`. Solo se repinta al cambiar de fotograma, y nada con el editor oculto.
- **Al exportar** (`features/export/utils/renderElements.ts`): la imagen lleva el fotograma que se ve en el lienzo, y el video de un documento de video lleva los GIFs moviéndose, con el fotograma de cada momento del video. Los GIFs se vuelven a abrir aparte (otro decodificador y otro canvas), así la animación de la pantalla no les cambia el fotograma a medias. La escena de Konva de los elementos se crea una vez y, con GIFs, se vuelve a pintar en cada fotograma, en el mismo canvas (a la resolución de salida con `setPixelRatio`).
- **Un lienzo o una foto con GIFs** se exportan **como imagen o como video**: el diálogo deja elegir (empieza en video). El video es un **MP4 sin sonido de 15 s** a 30 fotogramas por segundo, del tamaño del documento reducido a Full HD si es mayor (`fitVideoSize` en `lib/videoSize.ts`, el mismo que al abrir un video). Lo compone `exportAnimation` (`exportVideo.ts`) y lo codifica `encodeFrames` (`encodeVideo.ts`) con el `CanvasSource` de mediabunny. Va en el mismo archivo de JavaScript que exportar un video, así que solo se descarga al usarlo. El fondo (la foto) se reduce una vez al tamaño del video; los GIFs se repiten, cada uno a su ritmo, hasta el final. Medido en Edge: 1080 × 1080 con un GIF, unos 5 s.
- **Mientras se exporta un video**, la animación del lienzo se para: no le quita tiempo a la exportación.
- **Safari** no tiene `ImageDecoder`: allí el GIF se queda quieto en su primer fotograma, como una imagen normal, y el diálogo de exportar es el de siempre (solo imagen).

## Stickers animados (Lottie)

Un sticker **Lottie** se inserta igual que una imagen: «Insertar archivo» acepta también `.json` y `.tgs` (el formato de Telegram: el mismo JSON comprimido con gzip). Se mueve, se transforma y sigue al video como un GIF, y **también en Safari** (no usa `ImageDecoder`).

**«¿Qué puedo insertar?»**, encima de «Insertar archivo» en el mismo menú (separada por una línea, `hasSeparatorAfter` en `Menu`), abre una ayuda (`features/images/components/InsertHelpDialog.tsx`). Explica cada tipo de archivo (imágenes, GIFs, stickers Lottie y de Telegram) y cómo conseguirlos: guardar un GIF desde el navegador, LottieFiles y los emojis animados de Google para `.json`, y los bots de Telegram que convierten stickers a `.tgs`.

- **Biblioteca:** [lottie-web](https://github.com/airbnb/lottie-web) 5.13.0 (MIT), en su versión **`lottie_light_canvas`** (54,5 kB con gzip). Se descarga solo con el primer sticker (`editor/elements/lottieSticker.ts`, cargado bajo demanda).
- **Seguridad:**
  - la versión "light" no ejecuta las expresiones de After Effects (las versiones completas lo hacen con `eval`): un archivo malicioso no puede ejecutar código;
  - al insertarlo, `editor/elements/lottieFile.ts` comprueba que sea un Lottie con medidas razonables (como mucho 4096 px y 120 fps; el archivo hasta 5 MB y, descomprimido, hasta 20 MB, contra las "bombas" gzip);
  - rechaza imágenes que no vayan incrustadas y fuentes con ruta, porque lottie-web las descargaría de la dirección que diga el archivo (añadiendo un `<link>` o un `<style>` a la página).
- **Cómo se pinta:** lottie-web dibuja el fotograma de cada momento (`goToAndStop`, al ritmo del reloj de la animación) en un canvas propio, sin contenedor en el DOM, y ese canvas es el que pinta Konva, como con los GIFs. El fotograma de cada momento sale de `lottieFrameAt` (`animationTimeline.ts`).
- **Rendimiento con muchos stickers:**
  - un reproductor por archivo: las copias del mismo sticker se pintan una sola vez por fotograma;
  - resolución según cómo se ve en pantalla, por escalones (potencias de 2 entre 64 y 1024 px, `stickerResolution.ts`);
  - en pantalla, como mucho 30 fotogramas por segundo;
  - **pintado por turnos**: como mucho 8 ms de stickers por frame de pantalla; los que no caben esperan al siguiente, así un teléfono lento no se traba (sus animaciones van más despacio).
  - Medido en Edge con stickers reales (512 × 512, de 36 a 136 capas), móvil emulado con la CPU 4 veces más lenta: 30 copias del mismo, 144 fps; 9 distintos, 62 fps (peor frame 35 ms; antes de pintar por turnos, 24 fps con frames de 110 ms).
- **Al exportar** (`features/export/utils/renderElements.ts`), cada sticker usa un lector aparte del lienzo (`openLottieReader`), con su propio canvas al **tamaño con que sale en el archivo** (como mucho 2048 px): es vectorial, así que sale nítido. Se pinta en el momento exacto de cada fotograma, sin turnos ni límite de 30 fps. Como con los GIFs, la imagen lleva el fotograma visible y el video de un lienzo dura 15 s. Medido en Edge: un lienzo de 1080 × 1080 con tres stickers reales se exporta como video en 4,5 s.

## Rendimiento

- **El editor se carga bajo demanda** (`src/app/EditorShell.tsx`).
  - **Qué lleva:** todo lo que usa Konva (y el reconciliador de react-konva), en su propio archivo.
  - **El inicio** solo descarga el JS principal (~115 KB gzip; el motor de pinceles va con el editor) y, cuando el navegador está libre, **precarga el editor** en segundo plano.
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
  - toda la app (también el editor y el codificador de video, que se cargan aparte) queda en caché al instalarse el service worker, unos 1,3 MB (de ellos, unos 440 KB son el codificador de video). Así también se puede exportar un video sin conexión;
  - las **fuentes** se guardan la primera vez que se usan, o al abrir el panel «Fuente y estilo», y desde ahí también funcionan sin conexión.
- **Actualizaciones** (`features/update`): una versión nueva se descarga en segundo plano y se aplica **sin cerrar las pestañas**. El dibujo vive en memoria y recargar lo perdería, así que:
  - si no hay nada que perder (inicio sin documento), la app se recarga sola con la versión nueva; si se está eligiendo una foto, espera a que termine;
  - si hay algo abierto, la cabecera muestra **Actualizar**; con un dibujo, pide confirmación antes de recargar;
  - la app pregunta si hay versión nueva al abrirse, cada hora y al volver a su pestaña.
- **Hosting (Vercel, configurado en `vercel.json`):**
  - hace falta **HTTPS** (en `localhost` funciona sin él); Vercel lo da siempre;
  - `sw.js` e `index.html` **no** deben tener caché larga, porque si no las versiones nuevas tardan en llegar. Vercel ya los sirve así por defecto (`max-age=0, must-revalidate`), por eso `vercel.json` solo cambia la caché de `/assets`;
  - `outputDirectory: "build"` hace falta porque Vercel busca `dist/` en los proyectos de Vite;
  - en otro hosting la app funciona igual, pero hay que repetir estas dos cosas en su configuración.

## Tests e2e

Los tests de `e2e/` usan la app como una persona, en un navegador real, con [Playwright](https://playwright.dev/) (configuración en `playwright.config.ts`).

- **Qué prueban:**
  - el inicio: los lienzos en blanco, abrir, soltar o pegar una foto y la confirmación antes de descartar;
  - el video: abrirlo y ver su primer fotograma, dibujar encima, la confirmación antes de descartarlo y el aviso si el archivo no se puede abrir;
  - su reproducción: que el lienzo sigue los fotogramas, pausar con el botón y con K, la barra de tiempo, silenciar y el desenfoque, que sigue al video;
  - exportar el video: que el MP4 se reproduce, su tamaño, su duración, su sonido y el dibujo en dos momentos distintos; en el móvil, también el paso "El video está listo";
  - el dibujo: el trazo, deshacer y rehacer, el slider de tamaño, el borrador, el resaltador sobre una foto y el zoom;
  - los pinceles: las figuras de Formas y su menú, y el Desenfoque sobre una foto y sobre la pintura (en pantalla y exportado);
  - los textos: escribir, editar, el degradado y moverlos;
  - los GIFs: que uno insertado se mueve en el lienzo, y que un lienzo con un GIF se exporta como un MP4 de 15 s en el que el GIF se mueve;
  - los stickers: que uno `.json` y uno `.tgs` insertados se mueven en el lienzo, y que un lienzo con un sticker se exporta como un MP4 de 15 s en el que el sticker se mueve;
  - el fondo de color y de degradado;
  - exportar: el nombre y el tamaño del PNG, y su contenido;
  - el teclado y la PWA sin conexión.
- **Contra el build de producción:** `npm run test:e2e` hace `npm run build` y lo sirve en el puerto 4180. Así se prueba lo mismo que se publica, con el service worker.
- **Dos pantallas:** escritorio (1280 × 800, ratón y teclado) y móvil (390 × 844, táctil). En el móvil los trazos y el pellizco son toques reales, y la hoja de compartir se cambia por una falsa que guarda el archivo.
- **Navegador:** el **Microsoft Edge** del equipo (`channel: "msedge"`), así que no hace falta `npx playwright install`.
- **Cómo se comprueba el lienzo:** leyendo los **píxeles** de capturas de pantalla y de la imagen exportada. Se decodifican en el propio navegador, sin librerías de imágenes.
- **Archivos de prueba** (`e2e/fixtures/`):
  - `foto.png`: 400 × 300, negra a la izquierda y blanca a la derecha;
  - `video.mp4`: 320 × 240, 2 segundos, H.264 con sonido AAC (un tono). También es negro a la izquierda y blanco a la derecha, y su franja de arriba es roja el primer segundo y azul el segundo: así un test sabe en qué momento del video está. Se generó una vez en Edge, dibujando en un canvas y codificándolo con mediabunny;
  - `animado.gif`: 64 × 64, un fotograma rojo y otro azul de 200 ms, en bucle. Se generó una vez escribiendo los bytes del GIF con un script de Node (sin comprimir: los navegadores no codifican GIF);
  - `sticker.json` y `sticker.tgs`: un Lottie hecho a mano de 64 × 64, 30 fps y 12 fotogramas, rojo los 6 primeros y azul los 6 últimos (200 ms cada color, como el GIF). El `.tgs` es el mismo JSON comprimido con gzip.
- **Si un test falla:** Playwright guarda una traza (capturas, DOM y red de cada paso) en `test-results/`. Se abre con `npx playwright show-trace <ruta>/trace.zip`. El informe HTML queda en `playwright-report/`.

## CI (GitHub Actions)

En cada PR y cada push a `dev` y `main`, GitHub ejecuta `.github/workflows/ci.yml` en sus servidores (Ubuntu). En la PR aparecen dos comprobaciones con ✅ o ❌.

| Comprobación                             | Pasos                                                                           | Para repetirlo en local                          |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Formato, lint, tipos, tests y tamaño** | `npm ci` → `npm run check` → build → presupuesto de tamaño                      | `npm run check`, `npm run build && npm run size` |
| **Tests e2e (Playwright)**               | Solo si la anterior pasa. Los e2e en el Edge del runner, con hasta 2 reintentos | `npm run test:e2e`                               |

- **Si sale ❌:** en la PR, _Details_ lleva a la ejecución; se abre el paso en rojo para ver su salida. Después se repite el comando en local.
  - **Formato:** `npm run format` lo arregla.
  - **e2e:** el informe con capturas y trazas está en _Artifacts → informe-playwright_. Se descomprime y se abre con `npx playwright show-report <carpeta>/playwright-report`.
  - **Si al repetirlo pasa, era "flaky":** un fallo intermitente que conviene investigar.
- **Por qué en Linux:** distingue mayúsculas en los nombres de archivo y Windows no. Un import `./button` hacia `Button.tsx` funciona en Windows y falla aquí, como fallaría en muchos servidores.
- **Presupuesto de tamaño** (`scripts/check-bundle-size.js`):
  - mide con gzip el JS del **inicio** (lo que enlaza `build/index.html`), el del **video** (lo que solo se descarga para exportar un video, el de un video abierto o el de un lienzo con GIFs: el diálogo y el codificador, `VideoExportDialog-*` y `encodeVideo-*`), el de los **stickers** (lo que solo se descarga con el primer sticker: lottie-web y la lectura del archivo, `lottieSticker-*` y `lottieFile-*`) y el del **editor** (el resto);
  - falla si pasan de **120 kB**, **119 kB**, **59 kB** y **146 kB**: hoy son unos 119, 114, 57 y 144;
  - si un cambio necesita más, se sube el límite en ese archivo, en la misma PR, explicando por qué.
- **Acciones fijadas por commit (SHA):** el comentario indica la versión (`# v7.0.1`). **Dependabot** (`.github/dependabot.yml`) abre una vez al mes una PR a `dev` para actualizarlas, solo con versiones de más de 14 días. Empieza a funcionar cuando el archivo llega a `main`.
- **Coste:** gratis en repos públicos. En privados, el plan gratuito incluye unos 2.000 minutos al mes, y cada ejecución tarda unos 5. Un push nuevo a la misma PR cancela la ejecución anterior.
- **Opcional:** en GitHub, _Settings → Branches → Add branch ruleset_ (o _branch protection rule_) para `dev` y `main`, con _Require status checks to pass_. Así no se puede fusionar una PR en rojo.

## Estilos

- Los valores de diseño (colores, espaciado, radios, z-index) viven en `src/styles/tokens.css` y se usan con `var(--…)`.
- Todo el CSS son **CSS Modules** (`*.module.css`) y tokens; no hay CSS en JS.
- Iconos de **lucide-react** (cada uno se importa por separado). Si falta uno, se crea con `createLucideIcon` y el mismo trazo (ver `features/drawing/constants/brushIcons.ts`).
- Para botones usa `Button` o `IconButton` de `components/ui/Button`: son `<button>` reales, accesibles con teclado. `IconButton` exige `aria-label` y acepta `shortcut` para su tooltip.
- Para valores numéricos usa `Slider` (Radix, con etiqueta y valor y el aspecto de siempre: pista de 6 px y pulgar blanco) y, en el borde del lienzo, `VerticalSlider` (barra al estilo de iOS, sin pulgar visible).

## Interfaz (Radix UI)

Las piezas interactivas de `components/ui` se apoyan en [Radix UI](https://www.radix-ui.com/) (paquete `radix-ui`), que resuelve el foco, el teclado y el ARIA:

- **`Panel`**: en el móvil es una **hoja inferior modal** (se cierra con ✕, Escape, tocando fuera o deslizándola hacia abajo); en escritorio (≥ 900 px) es un **panel lateral no modal**: el lienzo sigue a la vista y se puede dibujar o elegir otro texto con él abierto. Al cerrarse, el foco vuelve al botón que lo abrió (`useReturnFocus`).
- **`Dialog`** y **`ConfirmDialog`** (exportar, borrar el dibujo), **`Menu`** (⋮), **`ChoiceMenu`** (un menú para elegir una opción entre varias, con la elegida marcada: la figura del pincel Formas), **`Segmented`** (opciones excluyentes: un grupo de radio que se recorre con flechas) y **`ColorControl`** (globo en escritorio, hoja en el móvil, con campo hex).
- **Iconos en los títulos:** `Panel` y `Dialog` aceptan `icon`, el del botón o la opción de menú que los abre (Fondo, Pinceles con el pincel activo, Exportar, Atajos de teclado, ¿Qué puedo insertar?). Es solo visual: el nombre accesible sigue siendo el título. Los que se abren desde un botón sin icono (Fuente y estilo, el color) y las confirmaciones no llevan. En la lista de atajos, cada atajo lleva también el icono de su botón o, si no tiene, uno de lucide que lo explique.
- **`Tooltip`**: solo con ratón o teclado, con el atajo de cada botón. No aparece cuando un panel devuelve el foco a su botón.
- Con un video: **`Slider`** de Radix en la barra de tiempo y **`ProgressBar`** (Radix Progress) en el avance de la exportación.
- Los atajos de teclado no actúan sobre la selección (Supr, Escape) si el foco está dentro de un panel o un menú.

## Stack

React 19 · Vite · Konva (react-konva) · Zustand · TypeScript · Radix UI · lucide-react · mediabunny (video) · lottie-web (stickers) · CSS Modules · Vitest + Testing Library · Playwright · ESLint + Prettier
