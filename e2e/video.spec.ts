import { expect, test } from "@playwright/test";
import {
  PHOTO,
  drag,
  expectColorAt,
  expectDocumentVisible,
  isDark,
  isRed,
  isWhite,
  openMenuItem,
  openVideo,
  pointIn,
  videoRect,
} from "./helpers";

test.describe("Video", () => {
  test("abre un video con el botón y muestra su primer fotograma", async ({
    page,
  }) => {
    await openVideo(page);
    const video = await videoRect(page);
    // Negro a la izquierda, blanco a la derecha y, arriba, la franja roja del
    // primer segundo: el video está en pausa en su primer fotograma.
    await expectColorAt(page, pointIn(video, 0.25, 0.6), isDark);
    await expectColorAt(page, pointIn(video, 0.75, 0.6), isWhite);
    await expectColorAt(page, pointIn(video, 0.75, 1 / 12), isRed);
    await expectColorAt(page, pointIn(video, 0.75, 0.25), isWhite);
  });

  test("se dibuja encima del video y se puede deshacer", async ({
    page,
    isMobile,
  }) => {
    await openVideo(page);
    const video = await videoRect(page);
    const onWhite = pointIn(video, 0.75, 0.6);
    await drag(
      page,
      [pointIn(video, 0.6, 0.6), pointIn(video, 0.9, 0.6)],
      isMobile
    );
    // El ratón fuera del lienzo: su círculo de tamaño no entra en la lectura.
    if (!isMobile) await page.mouse.move(2, 2);
    await expectColorAt(page, onWhite, isDark);
    // El trazo no tapa el resto del video.
    await expectColorAt(page, pointIn(video, 0.75, 1 / 12), isRed);

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expectColorAt(page, onWhite, isWhite);
  });

  test("con solo el video abierto ya pide confirmación antes de descartarlo", async ({
    page,
  }) => {
    await openVideo(page);
    await openMenuItem(page, "Volver al inicio");
    await expect(
      page.getByRole("button", { name: "Seguir editando" })
    ).toBeVisible();

    await page.getByRole("button", { name: /^Cuadrado,/ }).click();
    const confirm = page.getByRole("alertdialog", {
      name: "¿Empezar de nuevo?",
    });
    await confirm.getByRole("button", { name: "Descartar y abrir" }).click();
    await expectDocumentVisible(page);
  });

  test("avisa si el archivo no es un video que se pueda abrir", async ({
    page,
  }) => {
    await page.goto("/");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Agregar video" }).click();
    // Una imagen no se puede reproducir como video.
    await (await chooser).setFiles(PHOTO.path);
    await expect(
      page.getByText("No se pudo abrir el video", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();
  });
});
