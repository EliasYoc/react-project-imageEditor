// Presupuesto de tamaño: falla si el JavaScript de la app crece más de la
// cuenta. Se ejecuta después de `npm run build` (en CI, en cada PR).
//
// - Inicio: lo que descarga la pantalla de inicio, es decir, los scripts que
//   enlaza build/index.html (el resto de la app no hace falta para verla).
// - Editor: el resto del JS, que se descarga en segundo plano (ver App.tsx).
//
// Se mide comprimido con gzip, como lo envía el servidor. Si un cambio
// necesita de verdad más espacio, se sube el límite aquí, en la misma PR,
// explicando el porqué.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUILD_DIR = "build";
const BUDGETS_KB = { Inicio: 125, Editor: 130 };

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
const editorFiles = allAssets.filter((file) => !homeFiles.includes(file));

const sum = (files) => files.reduce((total, file) => total + gzipKb(file), 0);
const sizes = { Inicio: sum(homeFiles), Editor: sum(editorFiles) };

console.log("Presupuesto de tamaño (JS con gzip):");
let failed = false;
for (const [name, limit] of Object.entries(BUDGETS_KB)) {
  const size = sizes[name];
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `  ${ok ? "✓" : "✗"} ${name.padEnd(7)} ${size.toFixed(1).padStart(6)} kB de ${limit} kB`
  );
}

if (failed) {
  console.error(
    "\nEl JavaScript supera el presupuesto. Revisa qué ha crecido (p. ej. un import nuevo) o, si es necesario, sube el límite en scripts/check-bundle-size.js."
  );
  process.exit(1);
}
