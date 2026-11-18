import { expect, test, type Page } from "@playwright/test";
import {
  colorDistance,
  documentRect,
  drag,
  expectColorAt,
  isColorful,
  isDark,
  isWhite,
  openBlankCanvas,
  openMenuItem,
  pointIn,
  screenColor,
} from "./helpers";

const PINK = { r: 255, g: 59, b: 96 };

/** Abre el panel Fondo, elige el tipo y lo cierra. */
const chooseBackdrop = async (
  page: Page,
  type: "Ninguno" | "Color" | "Degradado",
  swatch?: string
) => {
  await page.getByRole("button", { name: "Fondo" }).click();
  const panel = page.getByRole("dialog", { name: "Fondo" });
  await panel
    .getByRole("radiogroup", { name: "Tipo de fondo" })
    .getByRole("radio", { name: type })
    .click();
  if (swatch) await panel.getByRole("button", { name: swatch }).click();
  await panel.getByRole("button", { name: "Cerrar" }).click();
  await expect(panel).toBeHidden();
};

test.describe("Fondo", () => {
  test("pone un color, un degradado y lo quita", async ({ page }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const center = pointIn(doc, 0.5, 0.5);

    await chooseBackdrop(page, "Color", "Color #ff3b60");
    await expect
      .poll(() => screenColor(page, center).then((c) => colorDistance(c, PINK)))
      .toBeLessThan(8);

    // Degradado: las esquinas opuestas tienen colores distintos.
    await chooseBackdrop(page, "Degradado");
    const corners = [
      pointIn(doc, 0.1, 0.1),
      pointIn(doc, 0.9, 0.9),
      pointIn(doc, 0.1, 0.9),
      pointIn(doc, 0.9, 0.1),
    ];
    await expectColorAt(page, corners[0], isColorful);
    const [a, b, c, d] = await Promise.all(
      corners.map((corner) => screenColor(page, corner))
    );
    expect(Math.max(colorDistance(a, b), colorDistance(c, d))).toBeGreaterThan(
      60
    );

    await chooseBackdrop(page, "Ninguno");
    await expectColorAt(page, center, isWhite);
  });

  test("«Borrar todo definitivamente» quita el dibujo y el color, y no se puede deshacer", async ({
    page,
    isMobile,
  }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const center = pointIn(doc, 0.5, 0.5);
    await chooseBackdrop(page, "Color", "Color #ff3b60");
    await drag(
      page,
      [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)],
      isMobile
    );
    if (!isMobile) await page.mouse.move(2, 2);
    await expectColorAt(page, center, isDark);

    await openMenuItem(page, "Borrar todo definitivamente");
    await page
      .getByRole("alertdialog", { name: "¿Borrar todo definitivamente?" })
      .getByRole("button", { name: "Borrar todo" })
      .click();
    // Ni el trazo ni el color: el lienzo vuelve a ser blanco.
    await expectColorAt(page, center, isWhite);
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Rehacer" })).toBeDisabled();
  });
});
