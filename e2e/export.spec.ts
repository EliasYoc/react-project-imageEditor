import { expect, test } from "@playwright/test";
import {
  PHOTO,
  documentRect,
  drag,
  expectColorAt,
  exportImage,
  fakeShareSheet,
  isDark,
  isWhite,
  openBlankCanvas,
  openPhoto,
  pngSize,
  pointIn,
  readPng,
} from "./helpers";

test.describe("Exportar", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // En el móvil se abre la hoja de compartir (aquí, una falsa).
    if (isMobile) await fakeShareSheet(page);
  });

  test("guarda el dibujo con el nombre sugerido y el tamaño del lienzo", async ({
    page,
    isMobile,
  }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    await drag(
      page,
      [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)],
      isMobile
    );
    await expectColorAt(page, pointIn(doc, 0.5, 0.5), isDark);

    const { name, bytes } = await exportImage(page, isMobile);
    expect(name).toMatch(/^dibujo-\d{4}-\d{2}-\d{2}\.png$/);
    if (!isMobile) {
      // El aviso dura 4 s: se comprueba enseguida.
      await expect(
        page.getByText(`Imagen descargada: ${name}`, { exact: true })
      ).toBeVisible();
    }
    expect(pngSize(bytes)).toEqual({ width: 2048, height: 2048 });
    // El trazo está en el centro, a la resolución del documento.
    const pixels = await readPng(page, bytes, {
      x: 1024,
      y: 1024,
      width: 1,
      height: 1,
    });
    expect(isDark(pixels.at(0, 0))).toBe(true);
  });

  test("una foto sale con su nombre y su resolución original", async ({
    page,
    isMobile,
  }) => {
    await openPhoto(page);
    const { name, bytes } = await exportImage(page, isMobile);
    expect(name).toBe("foto-editada.png");
    expect(pngSize(bytes)).toEqual({
      width: PHOTO.width,
      height: PHOTO.height,
    });
    const pixels = await readPng(page, bytes);
    expect(isDark(pixels.at(100, 150))).toBe(true);
    expect(isWhite(pixels.at(300, 150))).toBe(true);
  });

  test("el nombre se puede cambiar", async ({ page, isMobile }) => {
    await openBlankCanvas(page);
    // Cancelar no guarda el nombre escrito: al volver, está el sugerido.
    await page.getByRole("button", { name: "Exportar" }).click();
    const dialog = page.getByRole("dialog", { name: "Exportar imagen" });
    const field = dialog.getByRole("textbox", { name: "Nombre del archivo" });
    await field.fill("otro nombre");
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Exportar" }).click();
    await expect(field).toHaveValue(/^dibujo-/);
    await dialog.getByRole("button", { name: "Cancelar" }).click();

    const { name } = await exportImage(page, isMobile, "mi dibujo");
    expect(name).toBe("mi dibujo.png");
  });
});
