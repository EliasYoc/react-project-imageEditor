import { expect, test, type Page } from "@playwright/test";
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

/** Primera visita: se instala el service worker y, al recargar, controla la página. */
async function installApp(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller))
    .not.toBeNull();
}

/**
 * Simula que se publica una versión nueva: registra el mismo service worker
 * con otra URL. Para el navegador es una versión distinta, que se instala y
 * espera, como después de un deploy.
 */
async function publishNewVersion(page: Page) {
  // Sin esperar: si la app se recarga sola, no corta esta llamada.
  await page.evaluate(() => {
    void navigator.serviceWorker.register("/sw.js?version=2");
  });
}

/** La URL del service worker que controla la página. */
const controllerUrl = (page: Page) =>
  page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "");

/** Marca la página para saber si se recargó (la marca se pierde al recargar). */
const markPage = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { marked: boolean }).marked = true;
  });
const isMarked = (page: Page) => page.evaluate(() => "marked" in window);

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
    await installApp(page);

    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();

    // El editor (que se descarga aparte) también está guardado.
    await page
      .getByRole("button", { name: /^Publicación de Instagram,/ })
      .click();
    await expectDocumentVisible(page);
    const doc = await documentRect(page);
    await drag(page, [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)], false);
    await expectColorAt(page, pointIn(doc, 0.5, 0.5), isDark);
  });

  test("sin documento, la versión nueva se aplica sola", async ({ page }) => {
    await installApp(page);
    await markPage(page);

    const reloaded = page.waitForEvent("load");
    await publishNewVersion(page);
    // Se recarga sola para usarla y sigue en el inicio.
    await reloaded;
    expect(await isMarked(page)).toBe(false);
    expect(await controllerUrl(page)).toContain("version=2");
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();
  });

  test("con un dibujo, ofrece Actualizar y pide confirmación", async ({
    page,
  }) => {
    await installApp(page);
    await page
      .getByRole("button", { name: /^Publicación de Instagram,/ })
      .click();
    await expectDocumentVisible(page);
    const doc = await documentRect(page);
    const middle = pointIn(doc, 0.5, 0.5);
    await drag(page, [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)], false);
    await expectColorAt(page, middle, isDark);
    await markPage(page);

    await publishNewVersion(page);
    const update = page.getByRole("button", {
      name: "Actualizar a la versión nueva",
    });
    await expect(update).toBeVisible();
    // No se recargó: el dibujo sigue ahí y la versión nueva espera.
    expect(await isMarked(page)).toBe(true);
    expect(await controllerUrl(page)).not.toContain("version=2");

    // Cancelar no pierde nada.
    await update.click();
    const confirm = page.getByRole("alertdialog", {
      name: "¿Actualizar ahora?",
    });
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(confirm).toBeHidden();
    await page.mouse.move(0, 0);
    await expectColorAt(page, middle, isDark);
    expect(await isMarked(page)).toBe(true);

    // Confirmar recarga con la versión nueva (el dibujo se pierde).
    await update.click();
    const reloaded = page.waitForEvent("load");
    await confirm.getByRole("button", { name: "Actualizar" }).click();
    await reloaded;
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();
    expect(await isMarked(page)).toBe(false);
    expect(await controllerUrl(page)).toContain("version=2");
  });
});
