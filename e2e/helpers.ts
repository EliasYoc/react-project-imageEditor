import { expect, type Download, type Page } from "@playwright/test";

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Píxeles de una imagen: `at(x, y)` es el color de un punto. */
export interface Pixels {
  width: number;
  height: number;
  at: (x: number, y: number) => Rgba;
}

/** Foto de prueba: 400 × 300, mitad izquierda negra y mitad derecha blanca. */
export const PHOTO = {
  path: "e2e/fixtures/foto.png",
  width: 400,
  height: 300,
} as const;

/**
 * Decodifica un PNG en el navegador (createImageBitmap + canvas): así se leen
 * píxeles sin instalar un decodificador de PNG para Node. `region` limita los
 * datos que vuelven del navegador (una imagen grande serían millones).
 */
export async function readPng(
  page: Page,
  png: Uint8Array,
  region?: Rect
): Promise<Pixels> {
  const result = await page.evaluate(
    async ({ bytes, region }) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        { colorSpaceConversion: "none", premultiplyAlpha: "none" }
      );
      const box = region ?? {
        x: 0,
        y: 0,
        width: bitmap.width,
        height: bitmap.height,
      };
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Sin contexto 2D");
      ctx.drawImage(bitmap, 0, 0);
      const { data } = ctx.getImageData(box.x, box.y, box.width, box.height);
      return { width: box.width, height: box.height, data: Array.from(data) };
    },
    { bytes: Array.from(png), region }
  );
  const { width, height, data } = result;
  return {
    width,
    height,
    at: (x, y) => {
      const i = (Math.round(y) * width + Math.round(x)) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    },
  };
}

/** Lo que se ve en pantalla dentro de `clip` (en píxeles CSS). */
export async function screenPixels(page: Page, clip: Rect): Promise<Pixels> {
  const png = await page.screenshot({ clip, scale: "css" });
  return readPng(page, png);
}

/** El color que se ve en un punto de la pantalla. */
export async function screenColor(page: Page, { x, y }: Point) {
  return (await screenPixels(page, { x, y, width: 1, height: 1 })).at(0, 0);
}

/**
 * Espera a que el color que se ve en un punto cumpla `predicate` (el lienzo
 * se pinta en el siguiente frame, no al instante).
 */
export const expectColorAt = (
  page: Page,
  point: Point,
  predicate: (color: Rgba) => boolean
) =>
  expect
    .poll(() => screenColor(page, point).then(predicate), {
      message: `color en (${point.x}, ${point.y}): ${predicate.name}`,
    })
    .toBe(true);

export const isWhite = ({ r, g, b }: Rgba) => r > 240 && g > 240 && b > 240;
export const isDark = ({ r, g, b }: Rgba) => r < 60 && g < 60 && b < 60;
/** Tiene color (no es gris): el canal más alto y el más bajo se separan. */
export const isColorful = ({ r, g, b }: Rgba) =>
  Math.max(r, g, b) - Math.min(r, g, b) > 60;

/** Lo que mide la zona del lienzo (el <main> del editor). */
export async function stageRect(page: Page): Promise<Rect> {
  const box = await page.getByRole("main").boundingBox();
  if (!box) throw new Error("No se ve el lienzo");
  return box;
}

/**
 * El centro del documento ajustado. El lienzo ocupa toda la pantalla y el
 * ajuste deja libre la cabecera: el documento queda centrado entre la
 * cabecera y el borde de abajo.
 */
export async function fittedCenter(page: Page): Promise<Point> {
  const stage = await stageRect(page);
  // Su alto de layout: la cabecera entra con una animación (translateY) y su
  // posición en pantalla puede no ser la final todavía.
  const headerHeight = await page
    .getByRole("banner")
    .evaluate((header) => (header as HTMLElement).offsetHeight);
  return {
    x: Math.round(stage.x + stage.width / 2),
    y: Math.round(stage.y + (headerHeight + stage.height) / 2),
  };
}

/**
 * Dónde se ve el documento ajustado: el rectángulo blanco alrededor de su
 * centro (vale con el documento aún en blanco). Se busca en una fila y una
 * columna que pasan por el centro.
 *
 * El ancho se mide hacia la derecha y el alto hacia arriba, y se duplican:
 * en el móvil, el slider de tamaño tapa el borde izquierdo, y abajo el
 * documento puede quedar bajo la barra de herramientas, que flota encima.
 */
export async function documentRect(page: Page): Promise<Rect> {
  const stage = await stageRect(page);
  const center = await fittedCenter(page);
  const row = await screenPixels(page, {
    x: stage.x,
    y: center.y,
    width: Math.floor(stage.width),
    height: 1,
  });
  const column = await screenPixels(page, {
    x: center.x,
    y: stage.y,
    width: 1,
    height: Math.floor(stage.height),
  });
  const whiteRun = (length: number, at: (i: number) => Rgba, from: number) => {
    let start = from;
    let end = from;
    while (start > 0 && isWhite(at(start - 1))) start--;
    while (end < length - 1 && isWhite(at(end + 1))) end++;
    return { start, end };
  };
  const across = whiteRun(row.width, (i) => row.at(i, 0), center.x - stage.x);
  const down = whiteRun(
    column.height,
    (i) => column.at(0, i),
    center.y - stage.y
  );
  const halfWidth = across.end - (center.x - stage.x);
  const halfHeight = center.y - stage.y - down.start;
  // Simétrico respecto al centro: pointIn(rect, 0.5, 0.5) cae justo en él.
  return {
    x: center.x - halfWidth,
    y: center.y - halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2,
  };
}

/** Un punto del documento en proporción (0–1) de su ancho y su alto. */
export const pointIn = (rect: Rect, fx: number, fy: number): Point => ({
  x: Math.round(rect.x + rect.width * fx),
  y: Math.round(rect.y + rect.height * fy),
});

const STEPS = 12;

/** Los puntos intermedios de un recorrido (para que parezca un gesto real). */
const interpolate = (points: Point[]) =>
  points.slice(1).flatMap((to, index) => {
    const from = points[index];
    return Array.from({ length: STEPS }, (_, step) => ({
      x: from.x + ((to.x - from.x) * (step + 1)) / STEPS,
      y: from.y + ((to.y - from.y) * (step + 1)) / STEPS,
    }));
  });

/**
 * Arrastra por `points`: con el ratón en escritorio, con un dedo en el móvil
 * (eventos táctiles reales por el protocolo de DevTools: Playwright no tiene
 * gestos de arrastre táctil).
 */
export async function drag(page: Page, points: Point[], touch: boolean) {
  const [start] = points;
  if (!touch) {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const point of interpolate(points)) {
      await page.mouse.move(point.x, point.y);
    }
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const touchEvent = (
    type: "touchStart" | "touchMove" | "touchEnd",
    touchPoints: Point[]
  ) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
  await touchEvent("touchStart", [start]);
  for (const point of interpolate(points)) {
    await touchEvent("touchMove", [point]);
  }
  await touchEvent("touchEnd", []);
  await cdp.detach();
}

/** Pellizco con dos dedos: se separan (acercar) o se juntan (alejar). */
export async function pinch(
  page: Page,
  center: Point,
  from: number,
  to: number
) {
  const cdp = await page.context().newCDPSession(page);
  const fingers = (distance: number) => [
    { x: center.x - distance / 2, y: center.y, id: 0 },
    { x: center.x + distance / 2, y: center.y, id: 1 },
  ];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: fingers(from),
  });
  for (let step = 1; step <= STEPS; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: fingers(from + ((to - from) * step) / STEPS),
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}

/** Un toque (dedo) o clic (ratón) en un punto. */
export async function tapAt(page: Page, point: Point, touch: boolean) {
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

/**
 * Elige una opción del menú ⋮ de la cabecera (p. ej. "Exportar" o "Volver al
 * inicio").
 */
export async function openMenuItem(page: Page, name: string) {
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name }).click();
}

/** Empieza un lienzo en blanco desde el inicio y espera a que se vea. */
export async function openBlankCanvas(page: Page, preset = "Cuadrado") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`^${preset},`) }).click();
  await expect(
    page.getByRole("button", { name: "Más opciones" })
  ).toBeVisible();
  await expectDocumentVisible(page);
}

/** Abre la foto de prueba con el botón "Abrir una foto". */
export async function openPhoto(page: Page) {
  await page.goto("/");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Abrir una foto" }).click();
  await (await chooser).setFiles(PHOTO.path);
  await expect(
    page.getByRole("button", { name: "Más opciones" })
  ).toBeVisible();
}

/** Espera a que el lienzo muestre el documento (blanco en el centro). */
export async function expectDocumentVisible(page: Page) {
  const stage = await stageRect(page);
  await expect
    .poll(() =>
      screenColor(page, {
        x: stage.x + stage.width / 2,
        y: stage.y + stage.height / 2,
      }).then(isWhite)
    )
    .toBe(true);
}

/** Los bytes de un archivo descargado. */
export async function downloadBytes(download: Download) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

/** Cuántos píxeles de `rect` (en pantalla) cumplen `predicate`. */
export async function countPixels(
  page: Page,
  rect: Rect,
  predicate: (color: Rgba) => boolean
) {
  const pixels = await screenPixels(page, rect);
  let count = 0;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (predicate(pixels.at(x, y))) count++;
    }
  }
  return count;
}

/** Distancia entre dos colores (0 = iguales). */
export const colorDistance = (a: Rgba, b: Omit<Rgba, "a">) =>
  Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

/** Lo que recibe la hoja de compartir del móvil (ver `fakeShareSheet`). */
interface SharedFile {
  name: string;
  type: string;
  bytes: number[];
}

declare global {
  interface Window {
    __shared?: SharedFile;
  }
}

/**
 * En el móvil, exportar abre la hoja de compartir del sistema, que un
 * navegador automatizado no tiene: se cambia por una que guarda el archivo
 * para leerlo desde el test. Llamar antes de abrir la página.
 */
export async function fakeShareSheet(page: Page) {
  await page.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = async (data?: ShareData) => {
      const file = data?.files?.[0];
      if (!file) throw new Error("Sin archivo para compartir");
      window.__shared = {
        name: file.name,
        type: file.type,
        bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
      };
    };
  });
}

/**
 * Exporta con el diálogo (con otro nombre si se pasa `fileName`) y devuelve
 * el archivo: en escritorio se descarga; en el móvil va a la hoja de
 * compartir (falsa, ver `fakeShareSheet`).
 */
export async function exportImage(
  page: Page,
  isMobile: boolean,
  fileName?: string
) {
  await openMenuItem(page, "Exportar");
  const dialog = page.getByRole("dialog", { name: "Exportar imagen" });
  if (fileName !== undefined) {
    await dialog
      .getByRole("textbox", { name: "Nombre del archivo" })
      .fill(fileName);
  }
  const submit = dialog.getByRole("button", { name: "Exportar" });
  if (!isMobile) {
    const download = page.waitForEvent("download");
    await submit.click();
    const file = await download;
    return { name: file.suggestedFilename(), bytes: await downloadBytes(file) };
  }
  await submit.click();
  const shared = await page.waitForFunction(() => window.__shared);
  const { name, type, bytes } = (await shared.jsonValue()) as SharedFile;
  expect(type).toBe("image/png");
  return { name, bytes: new Uint8Array(bytes) };
}

/** Ancho y alto de un PNG, leídos de su cabecera (el bloque IHDR). */
export function pngSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  expect(Array.from(bytes.slice(0, 8))).toEqual(signature);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
