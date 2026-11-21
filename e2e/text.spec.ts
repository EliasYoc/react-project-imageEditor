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
  stageRect,
  tapAt,
  type Point,
  type Rect,
  type Rgba,
} from "./helpers";

/**
 * Dónde queda un texto nuevo: en el centro de lo que se ve, con la esquina
 * un poco a la izquierda y arriba (crece hacia la derecha al escribir).
 */
const textArea = (doc: Rect, center: Point): Rect => ({
  x: center.x - doc.width * 0.12,
  y: center.y - doc.height * 0.07,
  width: doc.width * 0.42,
  height: doc.height * 0.16,
});

const isLight = ({ r, g, b }: Rgba) => r > 200 && g > 200 && b > 200;

/** Añade un texto con lo escrito y toca fuera para terminar. */
const addText = async (page: Page, doc: Rect, touch: boolean) => {
  await page.getByRole("button", { name: "Agregar texto" }).click();
  const editor = page.getByRole("textbox", { name: "Texto" });
  await expect(editor).toBeFocused();
  await page.keyboard.type("Hola");
  // Tocar el fondo confirma el texto y quita la selección.
  await tapAt(page, pointIn(doc, 0.5, 0.9), touch);
  await expect(editor).toBeHidden();
};

test.describe("Texto", () => {
  test.beforeEach(async ({ page }) => {
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("añade un texto y lo vuelve a editar", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const center = pointIn(doc, 0.5, 0.5);
    await addText(page, doc, isMobile);
    await expect
      .poll(() => countPixels(page, textArea(doc, center), isDark))
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

  test("al editar un texto lejos, el editor sale centrado y arriba, y el texto vuelve a su sitio", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const center = pointIn(doc, 0.5, 0.5);
    const far = pointIn(doc, 0.75, 0.8);
    await addText(page, doc, isMobile);
    await drag(page, [center, far], isMobile);
    await expect
      .poll(() => countPixels(page, textArea(doc, far), isDark))
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

    // Al terminar, el texto sigue donde estaba (y no en el centro).
    await tapAt(page, pointIn(doc, 0.15, 0.15), isMobile);
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, textArea(doc, far), isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, textArea(doc, center), isDark)).toBe(0);
  });

  test("aplica un degradado al texto", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const center = pointIn(doc, 0.5, 0.5);
    await addText(page, doc, isMobile);
    const area = textArea(doc, center);
    // Negro: sin color todavía.
    await expect
      .poll(() => countPixels(page, area, isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, area, isColorful)).toBeLessThan(10);

    await tapAt(page, center, isMobile);
    await page.getByRole("button", { name: /^Fuente:/ }).click();
    const panel = page.getByRole("dialog", { name: "Fuente y estilo" });
    await panel.getByRole("checkbox", { name: "Degradado" }).check();
    await panel.getByRole("button", { name: "Cerrar" }).click();
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
    await addText(page, doc, isMobile);
    await tapAt(page, pointIn(doc, 0.5, 0.5), isMobile);
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
    const center = pointIn(doc, 0.5, 0.5);
    await addText(page, doc, isMobile);

    const target = pointIn(doc, 0.5, 0.75);
    await drag(page, [center, target], isMobile);
    await expect
      .poll(() => countPixels(page, textArea(doc, target), isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, textArea(doc, center), isDark)).toBe(0);
  });
});
