import { expect, test, type Page } from "@playwright/test";
import {
  countPixels,
  documentRect,
  drag,
  isColorful,
  isDark,
  openBlankCanvas,
  pointIn,
  tapAt,
  type Point,
  type Rect,
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
    await expect(page.getByRole("textbox", { name: "Texto" })).toHaveValue(
      "Hola"
    );
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
