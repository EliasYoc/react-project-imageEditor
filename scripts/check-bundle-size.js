// Presupuesto de tamaño: falla si el JavaScript de la app crece más de la
// cuenta. Se ejecuta después de `npm run build` (en CI, en cada PR).
//
// - Inicio: lo que descarga la pantalla de inicio, es decir, los scripts que
//   enlaza build/index.html (el resto de la app no hace falta para verla).
// - Editor: el resto del JS, que se descarga en segundo plano (ver App.tsx).
// - Video: lo que solo se descarga para exportar un video (el de un video
//   abierto o el de un lienzo con GIFs): el diálogo (VideoExportDialog-*.js)
//   y el codificador (encodeVideo-*.js, con mediabunny), que llega al
//   exportar. Va aparte para que Editor siga midiendo lo que tarda en cargar
//   el editor cuando no se usa video.
// - Stickers: lo que solo se descarga con el primer sticker Lottie: lottie-web
//   (lottieSticker-*.js) y la lectura del archivo (lottieFile-*.js). Va aparte
//   por lo mismo que Video.
//
// Se mide comprimido con gzip, como lo envía el servidor. Si un cambio
// necesita de verdad más espacio, se sube el límite aquí, en la misma PR,
// explicando el porqué.
//
// Historial de los límites (Inicio / Editor, en kB):
// - 125 / 130: al crear el presupuesto (medían 117,2 y 122,7).
// - 120 / 140: pinceles Formas, Desenfoque, Caligrafía y Neón (miden 113,6 y
//   132,0). El motor de pinceles pasó del inicio al editor (3,6 kB) y los
//   pinceles añaden 5,7 kB, 1,5 de ellos del filtro Blur de Konva.
// - 120 / 140 / Video 119: edición de video (miden 115,3, 138,2 y 113,4). El
//   límite de Video es lo que mide más un 5 %. Casi todo (111,1 kB) es el
//   codificador: convertir un video (leer MP4, MOV, WebM y MKV, y escribir
//   MP4) usa una parte grande de mediabunny. Sin WebM ni MKV serían 100,1.
// - 120 / 142 / Video 119: GIFs animados (el editor mide 140,1). Animarlos
//   en el lienzo y en la exportación añade 1,2 kB, y elegir imagen o video al
//   exportar un poco más. Cargar el código de exportar bajo demanda no
//   ayuda: solo ahorraba 1 kB al abrir el editor y cada trozo aparte suma.
// - 120 / 142 / Video 119 / Stickers 59: stickers Lottie (miden 118,7, 141,2,
//   114,0 y 56,5). El límite de Stickers es lo que mide más un 5 %; casi todo
//   es lottie-web en su versión "light" para canvas (54,5 kB).
// - 120 / 144 / Video 119 / Stickers 59: la ayuda «¿Qué puedo insertar?»
//   (el editor mide 142,4). Sus textos, el icono y el separador del menú
//   suman 1 kB; cargarla bajo demanda no ayuda (seguiría contando en Editor).
// - 120 / 146 / Video 119 / Stickers 59: la vista previa del texto en «Fuente
//   y estilo» (el editor mide 144,4). Su lienzo de Konva, la elección del
//   fondo y la colocación suman 1,6 kB.
// - 120 / 147 / Video 119 / Stickers 59: el editor de texto no queda debajo
//   del teclado del móvil y hay transición entre el texto y su editor (el
//   editor mide 146,8). Saber qué se ve con el teclado (visualViewport) y
//   colocar el editor suman 0,4 kB; la transición, 0,6 kB.
// - 120 / 148 / Video 119 / Stickers 59: los hooks del lienzo (el editor
//   mide 147,1). Repartir EditorStage en hooks (usePaintRasters,
//   useBackdropCanvas, useBackgroundBlur) suma 0,2 kB: los nombres de las
//   opciones y de lo que devuelven no se acortan al minificar.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUILD_DIR = "build";
const BUDGETS_KB = { Inicio: 120, Editor: 148, Video: 119, Stickers: 59 };
/** Los trozos que solo se descargan para exportar un video. */
const VIDEO_CHUNK = /^assets\/(encodeVideo|VideoExportDialog)-/;
/** Los trozos que solo se descargan con el primer sticker. */
const STICKER_CHUNK = /^assets\/(lottieSticker|lottieFile)-/;

const gzipKb = (file) =>
  gzipSync(readFileSync(join(BUILD_DIR, file)), { level: 9 }).length / 1000;

// Los scripts de index.html: <script src> y <link rel="modulepreload">.
const html = readFileSync(join(BUILD_DIR, "index.html"), "utf8");
const homeFiles = [
  ...html.matchAll(/<script[^>]*\ssrc="\/([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="\/([^"]+\.js)"/g),
].map((match) => match[1]);
if (homeFiles.length === 0) {
  console.error("No se encontró ningún script en build/index.html.");
  process.exit(1);
}

const allAssets = readdirSync(join(BUILD_DIR, "assets"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => `assets/${name}`);
const lazyFiles = allAssets.filter((file) => !homeFiles.includes(file));
const videoFiles = lazyFiles.filter((file) => VIDEO_CHUNK.test(file));
const stickerFiles = lazyFiles.filter((file) => STICKER_CHUNK.test(file));
// Todo lo demás cuenta como Editor: si el codificador o lottie-web cambiaran
// de nombre, engordaría esta línea y el presupuesto fallaría, en vez de no
// medirse.
const editorFiles = lazyFiles.filter(
  (file) => !VIDEO_CHUNK.test(file) && !STICKER_CHUNK.test(file)
);

const sum = (files) => files.reduce((total, file) => total + gzipKb(file), 0);
const sizes = {
  Inicio: sum(homeFiles),
  Editor: sum(editorFiles),
  Video: sum(videoFiles),
  Stickers: sum(stickerFiles),
};

console.log("Presupuesto de tamaño (JS con gzip):");
let failed = false;
for (const [name, limit] of Object.entries(BUDGETS_KB)) {
  const size = sizes[name];
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `  ${ok ? "✓" : "✗"} ${name.padEnd(8)} ${size.toFixed(1).padStart(6)} kB de ${limit} kB`
  );
}

if (failed) {
  console.error(
    "\nEl JavaScript supera el presupuesto. Revisa qué ha crecido (p. ej. un import nuevo) o, si es necesario, sube el límite en scripts/check-bundle-size.js."
  );
  process.exit(1);
}
