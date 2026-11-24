# Tests pendientes

Casos que se apuntan al hacer una tarea para escribirlos cuando el dueño lo
pida (regla 4 de `CLAUDE.md`). Al escribir uno, se quita de la lista.

## Un texto nuevo es negro con caja de fondo blanca

- **e2e:** un texto nuevo sobre una foto se ve: letras negras dentro de la
  caja blanca, también exportado.
- **e2e:** al quitar la caja a un texto negro mientras se escribe, la capa
  pasa de oscura a clara.

## Una capa tapa el lienzo mientras se escribe

- **e2e:** con un texto claro la capa es oscura, y con uno oscuro, clara; si
  se cambia el color mientras se escribe, la capa cambia con él.
- **e2e (escritorio):** doble clic sobre un texto ya seleccionado abre el
  editor y no lo cierra el segundo clic.
- **e2e:** tocar la capa confirma el texto y quita la selección; la cabecera
  y las barras siguen funcionando con la capa puesta.

## El texto se edita al tamaño de uno nuevo

- **e2e:** un texto encogido con el slider se edita al tamaño de uno nuevo.
- **e2e:** un texto agrandado con las asas o con el pellizco (escala, no
  tamaño de letra) se edita al tamaño de uno nuevo.
- **e2e:** un texto con ancho fijo (asas laterales) corta las líneas en el
  editor igual que en el lienzo.
- **e2e:** cambiar el tamaño con el slider mientras se escribe no cambia el
  editor, y al terminar el texto tiene el tamaño nuevo.

## Pellizcar un elemento lo agranda y lo gira

- **e2e:** un pellizco que empieza con los dos dedos en una zona vacía hace
  zoom del lienzo (y no cambia el elemento seleccionado).
- **e2e:** el segundo dedo de un pellizco que cae sobre otro elemento no lo
  selecciona: se pellizca el del primer dedo.
- **e2e:** arrastrar el texto con un dedo y pellizcarlo después deja dos pasos
  en el historial (el arrastre y el pellizco).
- **e2e:** girar los dos dedos sobre el texto seleccionado lo gira.
- **e2e:** pellizcar una imagen, un GIF y un sticker seleccionados (no solo un
  texto).
- **e2e:** un pellizco del elemento se deshace con un solo "Deshacer", y un
  toque con dos dedos sin moverlos no deja ningún paso en el historial.
- **e2e:** al soltar los dedos después del pellizco no se abre el editor del
  texto, y el texto se puede seguir arrastrando con un dedo.
- **e2e:** el pellizco empieza con los dedos fuera del elemento pero cerca
  (margen de 16 px) o con su punto medio encima.

## El selector de color del pincel ya no entra en bucle

- **e2e:** arrastrar rápido por el selector de color del pincel con la página
  ocupada no rompe la app (sin "Maximum update depth exceeded").
  - Para provocarlo hicieron falta commits lentos (un
    `__REACT_DEVTOOLS_GLOBAL_HOOK__` falso cuyo `onCommitFiberRoot` tarda
    ~8 ms) y eventos de ratón enviados por CDP cada 10 ms sin esperar a que se
    procese el anterior. Con `page.mouse` no se reproduce: espera a cada evento.
  - En la reproducción también era lento cada cambio del store (un Redux
    DevTools falso). Los e2e usan el build de producción, donde el store no
    conecta con DevTools: antes de darlo por bueno, comprobar que sin el
    arreglo el test falla.

## Los GIFs se mueven en el lienzo

- **e2e:** dos elementos con el mismo GIF se mueven los dos (comparten el
  decodificador y el canvas).
- **e2e:** con un video de fondo, el GIF se para cuando el video está en pausa
  y cambia de fotograma al mover la barra de tiempo.
- **e2e:** sin `ImageDecoder` (como en Safari; se simula borrándolo con
  `page.addInitScript`), el GIF se inserta quieto (solo se ve rojo) y no hay
  errores en la consola.
- **e2e:** un `.gif` dañado o un PNG renombrado a `.gif` muestra el aviso de
  error o se inserta quieto, y la app sigue funcionando.
- **e2e:** al volver al inicio con un GIF en el lienzo, la animación se para
  (sin `requestAnimationFrame` en marcha).

## La exportación lleva los GIFs en movimiento

Comprobado a mano en Edge (20/11/2026) con un script de Playwright: falta
convertirlo en e2e.

- **e2e:** exportar un video con un GIF encima: en el MP4, el centro del GIF
  es rojo y azul en momentos distintos (cada 0,2 s, como el GIF).
- **e2e:** exportar la imagen de un lienzo con un GIF: sale el fotograma que
  se ve (rojo o azul, no blanco).
- **e2e:** un GIF que no se puede decodificar al exportar sale quieto y la
  exportación termina (`loadImages` en `renderElements.ts`).

## Un lienzo o una foto con GIFs se exportan como imagen o como video

- **e2e:** elegir «Imagen» en el diálogo descarga un PNG con el fotograma que
  se ve (el título pasa a «Exportar imagen» y la extensión a `.png`).
- **e2e:** una foto con un GIF: el video sale del tamaño de la foto reducido
  a Full HD, con la foto de fondo.
- **e2e:** cancelar el video de 15 s a medias: el diálogo se cierra, no se
  descarga nada y el GIF del lienzo vuelve a moverse.
- **e2e (móvil):** si exportar tardó, el paso «El video está listo» y
  «Compartir o guardar» también funcionan con el video de un lienzo.
- **e2e:** sin `ImageDecoder` (Safari simulado), un lienzo con un GIF muestra
  el diálogo de siempre, solo de imagen.
- **unitario:** `encodeFrames` devuelve `unsupported` si no hay códec, y
  `canceled` al abortar (con mediabunny simulado).
- **Rendimiento:** un lienzo con 20 GIFs en un móvil (CPU ×4 más lenta): que
  la animación no se trabe y cuánto tarda el video de 15 s.

## Los stickers Lottie se insertan y se mueven en el lienzo

- **unitario:** `objectUrlFor` da la misma URL para el mismo contenido (y una
  nueva para otro), y `release` solo suelta una URL nueva.
- **e2e:** un `.json` que no es un sticker, y uno con una imagen externa,
  muestran su aviso («Este archivo no es un sticker animado», «El sticker usa
  archivos externos…») y no se insertan. Comprobado a mano el 20/11/2026.
- **e2e:** insertar dos veces el mismo sticker: los dos se mueven a la vez (el
  mismo reproductor).
- **e2e:** con un video de fondo, el sticker se para con el video en pausa.
- **e2e:** al hacer zoom, el sticker se repinta a más resolución (sin verse
  vacío al cambiar de escalón).
- **e2e:** sin `ImageDecoder` (Safari simulado), el sticker sí se mueve.
- **Rendimiento:** repetir la medición del README (30 copias y 9 distintos,
  móvil con CPU ×4) en un teléfono de verdad.

## Los stickers Lottie se exportan

Comprobado a mano en Edge (20/11/2026) con tres stickers reales: la imagen
sale nítida a 1080 × 1080 y el video de 15 s se exporta en 4,5 s.

- **e2e:** exportar como imagen un lienzo con un sticker: sale el fotograma
  que se ve (rojo o azul).
- **e2e:** un video con un sticker encima: en el MP4 el sticker va al ritmo
  del video.
- **e2e:** un sticker que ya no se puede leer al exportar no sale, y la
  exportación termina.
- **unitario:** `stickerSides` (renderElements) usa la copia más grande de
  cada sticker y no pasa de 2048 px.

## «¿Qué puedo insertar?» en el menú de la barra de Texto

- **e2e (móvil):** la ayuda se abre desde el menú, se lee entera (con scroll
  si no cabe) y se cierra con un toque fuera; el foco vuelve al menú.
- **unitario:** con el teclado, el separador no recibe foco (las flechas
  pasan de «¿Qué puedo insertar?» a «Insertar archivo»).

## La carga de imágenes vive en un solo sitio (`loadImageElement`)

- **e2e:** «Insertar una imagen» (menú «Más opciones» del modo Texto) la
  muestra en el lienzo, y la imagen exportada la incluye. Hoy ningún e2e
  inserta una imagen como elemento: solo hay un test unitario que comprueba
  que se abre el selector de archivos.
- **e2e:** insertar dos veces la misma imagen y una que no se puede leer (un
  archivo `.png` que no es una imagen): la segunda muestra el aviso de error y
  la app sigue funcionando.

## Un solo panel «Fuente y estilo»

Comprobado a mano en Edge (390, 320 y 1280 px de ancho) con un script de
Playwright: grosor y alineación quedan en la misma fila en los tres.

- **e2e (móvil):** a 320 px de ancho, Normal/Negrita y la alineación siguen en
  la misma fila y el panel no tiene scroll horizontal.
- **e2e (escritorio):** con el panel abierto (no modal), elegir otro texto
  actualiza el grosor, la alineación y la fuente marcada.
- **Decisión sin tomar:** al abrir el panel se descargan las 18 fuentes aunque
  solo se quiera cambiar la sombra. Si pesa, retrasar la descarga hasta que la
  lista se vea (y entonces, un test que lo compruebe).

## Vista previa del texto en «Fuente y estilo»

Comprobado a mano en Edge (390 y 1280 px de ancho): la vista previa queda fija
al hacer scroll y no asoma nada por encima. Konva no crea un lienzo en jsdom:
los tests de componentes la sustituyen por un marcador.

- **e2e (móvil):** a 320 px de ancho, la vista previa cabe y el texto se ve
  entero.
- **e2e:** un texto largo (más de 3 líneas, o una línea de más de 40 letras)
  muestra las primeras líneas con «…» y se encoge para caber.
- **e2e:** con la sombra al máximo y un contorno grueso, la sombra no se
  recorta por los bordes de la vista previa (`textBleed`).
- **e2e:** al cambiar a una fuente que aún no se ha descargado, la vista
  previa conserva el dibujo anterior y se actualiza al llegar la fuente.
- **Decisión sin tomar:** el color de la sombra no cuenta para elegir el fondo
  (una sombra blanca sobre el fondo blanco no se ve). Si molesta, añadirla a
  `previewBackdrop`.

## El editor de texto sale horizontal y centrado

Comprobado a mano en Edge (390 px) con un texto corto y con uno largo de una
sola línea (se encoge hasta caber, a un 15 % de su tamaño).

- **e2e:** un texto girado (con las asas de la selección) se edita horizontal.
  Hoy el e2e solo mueve el texto, no lo gira.
- **e2e:** un texto más ancho que la pantalla se edita encogido, sin salirse
  por los lados.
- **e2e:** al hacer zoom con el editor abierto, el editor cambia de tamaño y
  sigue centrado.
- **Decisión sin tomar:** en un documento muy apaisado o con una foto de otra
  proporción, el editor puede caer fuera del lienzo, sobre el fondo gris, y un
  texto oscuro no se ve. Una caja de fondo (blanca o gris, como la de la vista
  previa) detrás del editor lo arreglaría.

## Ancho máximo del texto (90 % del lienzo)

Comprobado en el e2e con una sola frase larga (móvil y escritorio).

- **e2e:** exportar una imagen con un texto largo: en el archivo exportado el
  texto también se reparte en líneas y no pasa del 90 % del ancho (la
  exportación y el lienzo comparten `applyTextMaxWidth`, pero hoy ningún e2e
  exporta un texto).
- **e2e:** un lienzo de otra proporción (apaisado o de 1920 px de ancho): el
  tope sigue siendo el 90 % de su ancho.
- **e2e:** acortar un texto largo ya confirmado (volver a editarlo) vuelve a
  encoger su caja, en vez de dejarla al 90 %.
- **Sin decidir:** una palabra más ancha que el 90 % se parte distinto en el
  editor (se sale por el lado, oculta) y en Konva (se parte por letras).
