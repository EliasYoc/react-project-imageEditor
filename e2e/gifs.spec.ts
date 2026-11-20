import { test } from "@playwright/test";
import {
  expectBothColorsAt,
  expectCanvasExportsAnimation,
  fakeShareSheet,
  fittedCenter,
  insertFile,
  openBlankCanvas,
} from "./helpers";

/** GIF de prueba: 64 × 64, un fotograma rojo y otro azul de 200 ms, en bucle. */
const GIF_PATH = "e2e/fixtures/animado.gif";

test.describe("GIFs", () => {
  test("un GIF insertado se mueve en el lienzo", async ({ page }) => {
    await openBlankCanvas(page);
    await insertFile(page, GIF_PATH);
    // Se inserta en el centro de la vista: allí se ven sus dos fotogramas.
    await expectBothColorsAt(page, await fittedCenter(page));
  });

  test("un lienzo con un GIF se exporta como un video de 15 s con el GIF moviéndose", async ({
    page,
    isMobile,
  }) => {
    // Componer y codificar 450 fotogramas tarda más que un test normal.
    test.setTimeout(120_000);
    if (isMobile) await fakeShareSheet(page);
    await openBlankCanvas(page);
    await insertFile(page, GIF_PATH);

    await expectCanvasExportsAnimation(page, isMobile);
  });
});
