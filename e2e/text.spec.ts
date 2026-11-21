import { expect, test, type Page } from "@playwright/test";
import {
  countPixels,
  documentRect,
  drag,
  isColorful,
  isDark,
  openBlankCanvas,
  pointIn,
  screenColor,
  screenPixels,
  stageRect,
  tapAt,
  type Point,
  type Rect,
  type Rgba,
} from "./helpers";

const isLight = ({ r, g, b }: Rgba) => r > 200 && g > 200 && b > 200;

const centerOf = ({ x, y, width, height }: Rect): Point => ({
  x: x + width / 2,
  y: y + height / 2,
});

/** El mismo rectángulo, movido lo que va de un punto a otro. */
const shifted = (area: Rect, from: Point, to: Point): Rect => ({
  ...area,
  x: area.x + to.x - from.x,
  y: area.y + to.y - from.y,
});

/** El rectángulo más pequeño que contiene todos los píxeles oscuros de `area`. */
const darkBounds = async (page: Page, area: Rect) => {
  const pixels = await screenPixels(page, area);
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (!isDark(pixels.at(x, y))) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return {
    left: area.x + left,
    right: area.x + right,
    top: area.y + top,
    bottom: area.y + bottom,
  };
};

/**
 * Añade un texto con lo escrito y toca fuera para terminar. Devuelve dónde
 * quedó: el sitio donde estaba el editor mientras se escribía (un texto nuevo
 * se queda donde se escribe, no donde se crea).
 */
const addText = async (page: Page, doc: Rect, touch: boolean) => {
  await page.getByRole("button", { name: "Agregar texto" }).click();
  const editor = page.getByRole("textbox", { name: "Texto" });
  await expect(editor).toBeFocused();
  await page.keyboard.type("Hola");
  const where = (await editor.boundingBox()) as Rect;
  // Tocar el fondo confirma el texto y quita la selección.
  await tapAt(page, pointIn(doc, 0.5, 0.9), touch);
  await expect(editor).toBeHidden();
  return where;
};

test.describe("Texto", () => {
  test.beforeEach(async ({ page }) => {
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("añade un texto y lo vuelve a editar", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const center = centerOf(where);
    await expect
      .poll(() => countPixels(page, where, isDark))
      .toBeGreaterThan(50);

    // Doble clic (o tocar un texto ya seleccionado) abre su editor.
    if (isMobile) {
      await tapAt(page, center, true);
      await tapAt(page, center, true);
    } else {
      await page.mouse.dblclick(center.x, center.y);
    }
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toHaveValue("Hola");
    // El cursor queda al final y no se selecciona el texto.
    expect(
      await editor.evaluate((element: HTMLTextAreaElement) => [
        element.selectionStart,
        element.selectionEnd,
      ])
    ).toEqual([4, 4]);
  });

  test("un texto nuevo queda donde se escribió", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    await page.getByRole("button", { name: "Agregar texto" }).click();
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();
    await page.keyboard.type("Hola");
    const box = (await editor.boundingBox()) as Rect;
    const area: Rect = {
      x: box.x - 12,
      y: box.y - 12,
      width: box.width + 24,
      height: box.height + 24,
    };
    // Dónde se ven las letras mientras se escribe.
    const typed = await darkBounds(page, area);

    await tapAt(page, pointIn(doc, 0.5, 0.9), isMobile);
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, area, isDark))
      .toBeGreaterThan(50);

    // Ya como texto del lienzo, las letras están en el mismo sitio (con un
    // margen: el navegador y Konva no dibujan la letra idéntica).
    const placed = await darkBounds(page, area);
    for (const side of ["left", "right", "top", "bottom"] as const) {
      expect(Math.abs(placed[side] - typed[side])).toBeLessThanOrEqual(4);
    }
  });

  test("al editar un texto lejos, el editor sale centrado y arriba, y el texto vuelve a su sitio", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const start = centerOf(where);
    const far = pointIn(doc, 0.75, 0.8);
    await drag(page, [start, far], isMobile);
    const moved = shifted(where, start, far);
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);

    // Se edita desde donde está. Tras arrastrarlo ya está seleccionado: en el
    // móvil basta un toque (un segundo caería fuera del editor y lo cerraría).
    if (isMobile) {
      await tapAt(page, far, true);
    } else {
      await page.mouse.dblclick(far.x, far.y);
    }
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();

    // Sale centrado en horizontal y por encima de donde estaba el texto.
    const stage = await stageRect(page);
    const box = (await editor.boundingBox()) as Rect;
    expect(
      Math.abs(box.x + box.width / 2 - (stage.x + stage.width / 2))
    ).toBeLessThan(3);
    expect(box.y + box.height).toBeLessThan(far.y);

    // Al terminar, el texto sigue donde estaba (y no donde se escribió).
    await tapAt(page, pointIn(doc, 0.15, 0.15), isMobile);
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, where, isDark)).toBe(0);
  });

  test("aplica un degradado al texto", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const area = await addText(page, doc, isMobile);
    // Negro: sin color todavía.
    await expect
      .poll(() => countPixels(page, area, isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, area, isColorful)).toBeLessThan(10);

    await tapAt(page, centerOf(area), isMobile);
    await page.getByRole("button", { name: /^Fuente:/ }).click();
    const panel = page.getByRole("dialog", { name: "Fuente y estilo" });
    await panel.getByRole("checkbox", { name: "Degradado" }).check();
    await panel.getByRole("button", { name: "Cerrar" }).click();
    // Hasta que no termina de cerrarse, la hoja sigue encima del lienzo y un
    // toque cae sobre ella (aquí desmarcaría el degradado).
    await expect(panel).toBeHidden();
    // Sin selección: el marco azul no cuenta como color del texto.
    await tapAt(page, pointIn(doc, 0.5, 0.9), isMobile);

    await expect
      .poll(() => countPixels(page, area, isColorful))
      .toBeGreaterThan(50);
  });

  test("la vista previa del panel muestra el texto y su estilo, y el fondo se oscurece", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    await tapAt(page, centerOf(where), isMobile);
    await page.getByRole("button", { name: /^Fuente:/ }).click();
    const panel = page.getByRole("dialog", { name: "Fuente y estilo" });
    const preview = panel.getByRole("img", { name: "Vista previa del texto" });
    const previewRect = async () => (await preview.boundingBox()) as Rect;
    // Un punto del fondo, sin letras y dentro de las esquinas redondeadas.
    const backdrop = async () => {
      const { x, y } = await previewRect();
      return screenColor(page, { x: x + 24, y: y + 10 });
    };

    // Texto negro: se ve sobre blanco.
    await expect
      .poll(async () => countPixels(page, await previewRect(), isDark))
      .toBeGreaterThan(50);
    expect(isLight(await backdrop())).toBe(true);

    // El contorno por defecto es blanco: el fondo pasa a gris oscuro y el
    // contorno se ve. La vista previa sigue a la vista al bajar a «Contorno».
    await panel.getByRole("checkbox", { name: "Contorno" }).check();
    await expect.poll(async () => isDark(await backdrop())).toBe(true);
    await expect
      .poll(async () => countPixels(page, await previewRect(), isLight))
      .toBeGreaterThan(50);

    await panel.getByRole("checkbox", { name: "Degradado" }).check();
    await expect
      .poll(async () => countPixels(page, await previewRect(), isColorful))
      .toBeGreaterThan(50);
  });

  test("mueve el texto arrastrándolo", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const start = centerOf(where);

    const target = pointIn(doc, 0.5, 0.75);
    await drag(page, [start, target], isMobile);
    await expect
      .poll(() => countPixels(page, shifted(where, start, target), isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, where, isDark)).toBe(0);
  });
});
