import { expect, test } from "@playwright/test";
import {
  documentRect,
  drag,
  expectColorAt,
  expectDocumentVisible,
  isDark,
  pointIn,
} from "./helpers";

// El service worker es el mismo en cualquier pantalla: basta con escritorio.
test.skip(({ isMobile }) => isMobile, "Basta con probarlo en escritorio");

test.describe("PWA", () => {
  test("el manifest permite instalar la app", async ({ page }) => {
    await page.goto("/");
    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(href).toBeTruthy();
    const response = await page.request.get(href ?? "");
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: "Editor de imágenes",
      display: "standalone",
      start_url: "/",
    });
    expect(manifest.icons).toContainEqual(
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" })
    );
  });

  test("funciona sin conexión después de la primera visita", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    // En la primera visita, el service worker se instala y guarda la app...
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // ...y a partir de la siguiente carga, la sirve él.
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller))
      .not.toBeNull();

    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();

    // El editor (que se descarga aparte) también está guardado.
    await page.getByRole("button", { name: /^Cuadrado,/ }).click();
    await expectDocumentVisible(page);
    const doc = await documentRect(page);
    await drag(page, [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)], false);
    await expectColorAt(page, pointIn(doc, 0.5, 0.5), isDark);
  });
});
