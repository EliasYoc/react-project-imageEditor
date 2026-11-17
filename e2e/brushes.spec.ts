import { expect, test, type Page } from "@playwright/test";
import {
  documentRect,
  drag,
  exportImage,
  fakeShareSheet,
  fittedCenter,
  isDark,
  isWhite,
  openBlankCanvas,
  openPhoto,
  pointIn,
  readPng,
  screenPixels,
  type Pixels,
  type Point,
} from "./helpers";

/** Elige un pincel de la biblioteca (con un pincel activo, no un borrador). */
async function chooseBrush(page: Page, name: string) {
  // El pincel activo se vuelve a pulsar para abrir la biblioteca.
  await page.getByRole("button", { name: /^Pincel: / }).click();
  const library = page.getByRole("dialog", { name: "Pinceles" });
  await library.getByRole("button", { name, exact: true }).click();
  await library.getByRole("button", { name: "Cerrar" }).click();
  await expect(library).toBeHidden();
  await expect(
    page.getByRole("button", { name: `Pincel: ${name}` })
  ).toHaveAttribute("aria-pressed", "true");
}

/**
 * Arrastra y aparta el ratón del lienzo: en escritorio, el círculo que marca
 * el tamaño del pincel se queda donde acabó el trazo y saldría en los píxeles
 * que se leen después.
 */
async function stroke(page: Page, points: Point[], isMobile: boolean) {
  await drag(page, points, isMobile);
  if (!isMobile) await page.mouse.move(0, 0);
}

/** Una fila de píxeles de la pantalla, centrada en `center`. */
const screenRow = (page: Page, center: Point, halfWidth: number) =>
  screenPixels(page, {
    x: Math.round(center.x) - halfWidth,
    y: Math.round(center.y),
    width: halfWidth * 2 + 1,
    height: 1,
  });

/** Cuántos tramos oscuros (separados por blanco) hay en una fila. */
const darkRuns = (row: Pixels) => {
  let runs = 0;
  let inRun = false;
  for (let x = 0; x < row.width; x++) {
    const dark = isDark(row.at(x, 0));
    if (dark && !inRun) runs++;
    if (dark) inRun = true;
    else if (isWhite(row.at(x, 0))) inRun = false;
  }
  return runs;
};

/**
 * Cuántos píxeles de una fila son grises: ni negros ni blancos. En un borde
 * nítido entre negro y blanco casi no hay; desenfocado, hay muchos.
 */
const grayPixels = (row: Pixels) => {
  let count = 0;
  for (let x = 0; x < row.width; x++) {
    const color = row.at(x, 0);
    if (!isDark(color) && !isWhite(color)) count++;
  }
  return count;
};

test.describe("Pincel de formas", () => {
  test("deja figuras separadas y se puede elegir la figura", async ({
    page,
    isMobile,
  }) => {
    // Lienzo del tamaño de la pantalla: las figuras se ven a su tamaño.
    await openBlankCanvas(page, "Pantalla");
    const doc = await documentRect(page);

    await page.getByRole("button", { name: "Pincel: Pluma" }).click();
    const library = page.getByRole("dialog", { name: "Pinceles" });
    await library
      .getByRole("button", { name: "Más opciones de Formas" })
      .click();
    await expect(
      page.getByRole("menuitemradio", { name: "Círculos" })
    ).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitemradio", { name: "Cuadrados" }).click();
    // Elegir una figura activa el pincel y deja la biblioteca abierta.
    await expect(
      library.getByRole("button", { name: "Formas", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await library
      .getByRole("button", { name: "Más opciones de Formas" })
      .click();
    await expect(
      page.getByRole("menuitemradio", { name: "Cuadrados" })
    ).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await library.getByRole("button", { name: "Cerrar" }).click();
    await expect(library).toBeHidden();

    const middle = pointIn(doc, 0.5, 0.5);
    const halfWidth = Math.floor(doc.width * 0.4);
    await stroke(
      page,
      [pointIn(doc, 0.15, 0.5), pointIn(doc, 0.85, 0.5)],
      isMobile
    );
    // Una línea continua sería un solo tramo oscuro.
    await expect
      .poll(async () => darkRuns(await screenRow(page, middle, halfWidth)))
      .toBeGreaterThanOrEqual(4);

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect
      .poll(async () => darkRuns(await screenRow(page, middle, halfWidth)))
      .toBe(0);
    await page.getByRole("button", { name: "Rehacer" }).click();
    await expect
      .poll(async () => darkRuns(await screenRow(page, middle, halfWidth)))
      .toBeGreaterThanOrEqual(4);
  });
});

test.describe("Desenfoque", () => {
  test("desenfoca la foto, también al exportar, y el borrador lo quita", async ({
    page,
    isMobile,
  }) => {
    if (isMobile) await fakeShareSheet(page);
    await openPhoto(page);

    // La foto es negra a la izquierda y blanca a la derecha: el borde entre
    // las dos mitades pasa por el centro del documento.
    const center = await fittedCenter(page);
    const edge = () => screenRow(page, center, 30);
    const across = [
      { x: center.x - 70, y: center.y },
      { x: center.x + 70, y: center.y },
    ];
    await expect.poll(async () => grayPixels(await edge())).toBeLessThan(3);

    await chooseBrush(page, "Desenfoque");
    await stroke(page, across, isMobile);
    await expect.poll(async () => grayPixels(await edge())).toBeGreaterThan(5);

    // Igual en la imagen exportada (400 × 300; el borde está en x = 200).
    const { bytes } = await exportImage(page, isMobile);
    const exported = await readPng(page, bytes, {
      x: 170,
      y: 150,
      width: 61,
      height: 1,
    });
    expect(grayPixels(exported)).toBeGreaterThan(5);
    // Fuera del trazo (más arriba) la foto sigue nítida.
    const untouched = await readPng(page, bytes, {
      x: 170,
      y: 20,
      width: 61,
      height: 1,
    });
    expect(grayPixels(untouched)).toBeLessThan(3);

    // El borrador quita el desenfoque: el borde vuelve a ser nítido.
    await page.getByRole("button", { name: "Borrador: Borrador duro" }).click();
    await stroke(page, across, isMobile);
    await expect.poll(async () => grayPixels(await edge())).toBeLessThan(3);

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect.poll(async () => grayPixels(await edge())).toBeGreaterThan(5);
  });

  test("desenfoca también lo ya pintado", async ({ page, isMobile }) => {
    await openBlankCanvas(page, "Pantalla");
    const doc = await documentRect(page);

    // Una raya vertical gruesa y de bordes nítidos.
    await chooseBrush(page, "Marcador");
    await stroke(
      page,
      [pointIn(doc, 0.5, 0.25), pointIn(doc, 0.5, 0.75)],
      isMobile
    );
    const middle = pointIn(doc, 0.5, 0.5);
    const line = () => screenRow(page, middle, 60);
    await expect.poll(async () => darkRuns(await line())).toBe(1);
    const sharp = grayPixels(await line());
    expect(sharp).toBeLessThan(8);

    await chooseBrush(page, "Desenfoque");
    await stroke(
      page,
      [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)],
      isMobile
    );
    await expect
      .poll(async () => grayPixels(await line()))
      .toBeGreaterThan(sharp + 8);
    // Fuera del trazo de desenfoque, la raya sigue nítida.
    const above = await screenRow(page, pointIn(doc, 0.5, 0.3), 60);
    expect(grayPixels(above)).toBeLessThan(8);
  });
});
