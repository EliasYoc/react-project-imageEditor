import { test } from "@playwright/test";
import {
  expectBothColorsAt,
  expectCanvasExportsAnimation,
  fakeShareSheet,
  fittedCenter,
  insertFile,
  openBlankCanvas,
} from "./helpers";

/**
 * Stickers de prueba: un Lottie de 64 × 64 a 30 fps y 12 fotogramas, rojo
 * los 6 primeros y azul los 6 últimos (200 ms cada color, como el GIF de
 * prueba). El .tgs es el mismo JSON comprimido con gzip, como los de Telegram.
 */
const STICKERS = ["e2e/fixtures/sticker.json", "e2e/fixtures/sticker.tgs"];

test.describe("Stickers", () => {
  for (const path of STICKERS) {
    test(`un sticker ${path.slice(path.lastIndexOf("."))} insertado se mueve en el lienzo`, async ({
      page,
    }) => {
      await openBlankCanvas(page);
      await insertFile(page, path);
      // Se inserta en el centro de la vista: allí se ven sus dos colores.
      await expectBothColorsAt(page, await fittedCenter(page));
    });
  }

  test("un lienzo con un sticker se exporta como un video de 15 s con el sticker moviéndose", async ({
    page,
    isMobile,
  }) => {
    // Componer y codificar 450 fotogramas tarda más que un test normal.
    test.setTimeout(120_000);
    if (isMobile) await fakeShareSheet(page);
    await openBlankCanvas(page);
    await insertFile(page, STICKERS[0]);

    await expectCanvasExportsAnimation(page, isMobile);
  });
});
