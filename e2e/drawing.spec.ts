import { expect, test, type Page } from "@playwright/test";
import {
  documentRect,
  drag,
  expectColorAt,
  exportImage,
  fakeShareSheet,
  isColorful,
  isDark,
  isWhite,
  openBlankCanvas,
  openPhoto,
  pinch,
  pointIn,
  readPng,
  screenPixels,
  stageRect,
  type Point,
} from "./helpers";

/** Grosor en pantalla de un trazo horizontal que pasa por `point`. */
const strokeThickness = async (page: Page, point: Point) => {
  const column = await screenPixels(page, {
    x: point.x,
    y: point.y - 60,
    width: 1,
    height: 120,
  });
  let thickness = 0;
  for (let y = 0; y < column.height; y++) {
    if (!isWhite(column.at(0, y))) thickness++;
  }
  return thickness;
};

test.describe("Dibujo", () => {
  test("dibuja un trazo, lo deshace y lo rehace", async ({
    page,
    isMobile,
  }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const middle = pointIn(doc, 0.5, 0.5);

    await drag(
      page,
      [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)],
      isMobile
    );
    await expectColorAt(page, middle, isDark);

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expectColorAt(page, middle, isWhite);
    await page.getByRole("button", { name: "Rehacer" }).click();
    await expectColorAt(page, middle, isDark);
  });

  test("el slider cambia el tamaño del pincel", async ({ page, isMobile }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const slider = page.getByRole("slider", { name: "Tamaño del pincel" });
    await expect(slider).toHaveAttribute("aria-valuetext", "16 px");

    const thin = pointIn(doc, 0.5, 0.35);
    await drag(
      page,
      [pointIn(doc, 0.3, 0.35), pointIn(doc, 0.7, 0.35)],
      isMobile
    );
    await expectColorAt(page, thin, isDark);
    const thinWidth = await strokeThickness(page, thin);

    if (isMobile) {
      // Con el dedo: el slider asoma por el borde izquierdo; se arrastra
      // hacia arriba (arriba = más grande).
      // El slider entero (Radix), no solo su pulgar invisible.
      const root = slider.locator(
        'xpath=ancestor::*[@data-orientation="vertical"][last()]'
      );
      const box = await root.boundingBox();
      if (!box) throw new Error("No se ve el slider");
      const x = Math.max(box.x + box.width / 2, 8);
      await drag(
        page,
        [
          { x, y: box.y + box.height * 0.8 },
          { x, y: box.y + box.height * 0.35 },
        ],
        true
      );
    } else {
      await slider.focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press("PageUp");
    }
    const size = parseInt((await slider.getAttribute("aria-valuetext")) ?? "");
    expect(size).toBeGreaterThan(40);

    const thick = pointIn(doc, 0.5, 0.65);
    await drag(
      page,
      [pointIn(doc, 0.3, 0.65), pointIn(doc, 0.7, 0.65)],
      isMobile
    );
    await expectColorAt(page, thick, isDark);
    expect(await strokeThickness(page, thick)).toBeGreaterThan(thinWidth * 2);
  });

  test("el borrador quita la pintura", async ({ page, isMobile }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const line = [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)];
    const middle = pointIn(doc, 0.5, 0.5);
    await drag(page, line, isMobile);
    await expectColorAt(page, middle, isDark);

    const eraser = page.getByRole("button", {
      name: "Borrador: Borrador duro",
    });
    await eraser.click();
    await expect(eraser).toHaveAttribute("aria-pressed", "true");
    await drag(page, line, isMobile);
    await expectColorAt(page, middle, isWhite);
  });

  test("el resaltador tiñe la foto sin taparla", async ({ page, isMobile }) => {
    if (isMobile) await fakeShareSheet(page);
    await openPhoto(page);

    // El pincel activo se vuelve a pulsar para abrir la biblioteca.
    await page.getByRole("button", { name: "Pincel: Pluma" }).click();
    const library = page.getByRole("dialog", { name: "Pinceles" });
    await library
      .getByRole("button", { name: "Resaltador", exact: true })
      .click();
    await library.getByRole("button", { name: "Cerrar" }).click();
    // Sin esperar a que el panel termine de cerrarse, como haría una persona
    // rápida: el selector de color no debe cerrarse solo.
    await page.getByRole("button", { name: "Color del pincel" }).click();
    await page.getByRole("button", { name: "Color #ffcc00" }).click();
    if (isMobile) {
      await page
        .getByRole("dialog", { name: "Color del pincel" })
        .getByRole("button", { name: "Cerrar" })
        .click();
    } else {
      await page.keyboard.press("Escape");
    }

    // La foto es negra a la izquierda y blanca a la derecha; el trazo
    // amarillo cruza las dos mitades por el centro.
    const stage = await stageRect(page);
    const center = {
      x: Math.round(stage.x + stage.width / 2),
      y: Math.round(stage.y + stage.height / 2),
    };
    await drag(
      page,
      [
        { x: center.x - 80, y: center.y },
        { x: center.x + 80, y: center.y },
      ],
      isMobile
    );
    // Multiplica: sobre el blanco se ve amarillo y el negro sigue negro (un
    // pincel normal lo taparía).
    await expectColorAt(page, { x: center.x + 40, y: center.y }, isColorful);
    await expectColorAt(page, { x: center.x - 40, y: center.y }, isDark);

    // Igual en la imagen exportada (400 × 300, el trazo pasa por y = 150).
    const { bytes } = await exportImage(page, isMobile);
    const exported = await readPng(page, bytes, {
      x: 180,
      y: 150,
      width: 41,
      height: 1,
    });
    expect(isDark(exported.at(0, 0))).toBe(true);
    expect(isColorful(exported.at(40, 0))).toBe(true);
  });

  test("acerca y aleja el lienzo", async ({ page, isMobile }) => {
    await openBlankCanvas(page);
    const zoom = page.getByTitle("Nivel de zoom");
    const percent = async () => parseInt(await zoom.innerText());
    const fitted = await percent();

    if (isMobile) {
      const stage = await stageRect(page);
      await pinch(
        page,
        { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 },
        80,
        240
      );
    } else {
      await page.getByRole("button", { name: "Acercar" }).click();
    }
    await expect.poll(percent).toBeGreaterThan(fitted);

    await page.getByRole("button", { name: "Ajustar a la pantalla" }).click();
    await expect.poll(percent).toBe(fitted);
  });
});
