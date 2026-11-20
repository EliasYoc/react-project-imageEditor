import { expect, test, type Page } from "@playwright/test";
import {
  fittedCenter,
  isBlue,
  isRed,
  openBlankCanvas,
  screenColor,
  type Point,
} from "./helpers";

/** GIF de prueba: 64 × 64, un fotograma rojo y otro azul de 200 ms, en bucle. */
const GIF_PATH = "e2e/fixtures/animado.gif";

/** Inserta el GIF de prueba con «Insertar una imagen» (modo Texto). */
async function insertGif(page: Page) {
  await page.getByRole("radio", { name: "Texto" }).click();
  const chooser = page.waitForEvent("filechooser");
  // El «Más opciones» de la barra de herramientas, no el de la cabecera.
  await page
    .getByRole("contentinfo")
    .getByRole("button", { name: "Más opciones", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Insertar una imagen" }).click();
  await (await chooser).setFiles(GIF_PATH);
}

/** Mira el punto una y otra vez hasta ver los dos colores del GIF. */
const expectBothColorsAt = (page: Page, point: Point) => {
  const seen = new Set<string>();
  return expect
    .poll(
      async () => {
        const color = await screenColor(page, point);
        if (isRed(color)) seen.add("rojo");
        if (isBlue(color)) seen.add("azul");
        return [...seen].sort();
      },
      { intervals: [50], message: "el GIF cambia de fotograma" }
    )
    .toEqual(["azul", "rojo"]);
};

test.describe("GIFs", () => {
  test("un GIF insertado se mueve en el lienzo", async ({ page }) => {
    await openBlankCanvas(page);
    await insertGif(page);
    // Se inserta en el centro de la vista: allí se ven sus dos fotogramas.
    await expectBothColorsAt(page, await fittedCenter(page));
  });
});
