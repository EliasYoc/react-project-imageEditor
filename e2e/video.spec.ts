import { expect, test, type Page } from "@playwright/test";
import {
  PHOTO,
  VIDEO,
  chooseBrush,
  drag,
  expectColorAt,
  expectDocumentVisible,
  isBlue,
  isDark,
  isRed,
  isWhite,
  openMenuItem,
  openPhoto,
  openVideo,
  pointIn,
  videoRect,
  type Rgba,
} from "./helpers";

/** La barra de reproducción, encima de las herramientas. */
const playbackBar = (page: Page) =>
  page.getByRole("group", { name: "Reproducción del video" });

/** El pulgar de la barra de tiempo (el que recibe el foco y el teclado). */
const timeSlider = (page: Page) =>
  page.getByRole("slider", { name: "Posición del video" });

/** Por dónde va el video, en segundos. */
const currentTime = async (page: Page) =>
  Number(await timeSlider(page).getAttribute("aria-valuenow"));

/** Toca la barra de tiempo en una proporción (0–1) de su ancho. */
async function seekTo(page: Page, fraction: number) {
  // La raíz del slider de Radix: la única pieza con `dir`.
  const box = await playbackBar(page).locator("[dir]").boundingBox();
  if (!box) throw new Error("No se ve la barra de tiempo");
  await page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2);
}

// Un color mezclado con blanco: el desenfoque del borde de la franja.
const isReddish = ({ r, g, b }: Rgba) => r - g > 30 && r - b > 30;
const isBluish = ({ r, g, b }: Rgba) => b - r > 30 && b - g > 30;
const isUntinted = (color: Rgba) => !isReddish(color) && !isBluish(color);

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
    // Un lienzo en blanco no tiene nada que reproducir.
    await expect(playbackBar(page)).toHaveCount(0);
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

test.describe("Reproducción del video", () => {
  test("reproduce el video: el lienzo sigue sus fotogramas hasta el final", async ({
    page,
  }) => {
    await openVideo(page);
    const video = await videoRect(page);
    const strip = pointIn(video, 0.75, 1 / 12);
    const bar = playbackBar(page);
    await expect(bar).toContainText("0:00 / 0:02");
    await expectColorAt(page, strip, isRed);

    await bar.getByRole("button", { name: "Reproducir" }).click();
    // La franja pasa a azul en el segundo 1: el lienzo se repinta solo.
    await expectColorAt(page, strip, isBlue);
    // Al terminar se queda en el último fotograma y se puede volver a ver.
    await expect(bar.getByRole("button", { name: "Reproducir" })).toBeVisible();
    await expect(bar).toContainText("0:02 / 0:02");
    await expectColorAt(page, strip, isBlue);
  });

  test("pausa con el botón y con la tecla K", async ({ page, isMobile }) => {
    await openVideo(page);
    const bar = playbackBar(page);
    await bar.getByRole("button", { name: "Reproducir" }).click();
    await bar.getByRole("button", { name: "Pausar" }).click();
    await expect(bar.getByRole("button", { name: "Reproducir" })).toBeVisible();
    // Se quedó a medias, no al final.
    const pausedAt = await currentTime(page);
    expect(pausedAt).toBeLessThan(VIDEO.duration - 0.1);

    test.skip(isMobile, "Los atajos de teclado son de escritorio");
    await page.keyboard.press("k");
    // Está en marcha: el tiempo avanza (y la barra de tiempo con él).
    await expect.poll(() => currentTime(page)).toBeGreaterThan(pausedAt);
    await page.keyboard.press("k");
    await expect(bar.getByRole("button", { name: "Reproducir" })).toBeVisible();
    expect(await currentTime(page)).toBeLessThan(VIDEO.duration - 0.1);
  });

  test("la barra de tiempo lleva el video a otro momento", async ({ page }) => {
    await openVideo(page);
    const video = await videoRect(page);
    const strip = pointIn(video, 0.75, 1 / 12);

    // Con el dedo o el ratón: a 3/4 ya es el segundo azul; a 1/4, el rojo.
    await seekTo(page, 0.75);
    await expectColorAt(page, strip, isBlue);
    await expect(playbackBar(page)).toContainText("0:01 / 0:02");
    await seekTo(page, 0.25);
    await expectColorAt(page, strip, isRed);
    await expect(playbackBar(page)).toContainText("0:00 / 0:02");

    // Con el teclado: Fin e Inicio.
    await timeSlider(page).focus();
    await page.keyboard.press("End");
    await expectColorAt(page, strip, isBlue);
    await page.keyboard.press("Home");
    await expectColorAt(page, strip, isRed);
    expect(await currentTime(page)).toBe(0);
  });

  test("silenciar cambia el botón, y las barras ocultas se llevan la reproducción", async ({
    page,
  }) => {
    await openVideo(page);
    const bar = playbackBar(page);
    await bar.getByRole("button", { name: "Silenciar" }).click();
    await bar.getByRole("button", { name: "Activar el sonido" }).click();
    await expect(bar.getByRole("button", { name: "Silenciar" })).toBeVisible();

    await page.getByRole("button", { name: "Ocultar las barras" }).click();
    await expect(bar).toBeHidden();
    await page.getByRole("button", { name: "Mostrar las barras" }).click();
    await expect(bar).toBeVisible();
  });

  test("el desenfoque sigue al video, y empezar a desenfocar lo pausa", async ({
    page,
    isMobile,
  }) => {
    await openVideo(page);
    const video = await videoRect(page);
    const bar = playbackBar(page);
    await chooseBrush(page, "Desenfoque");

    // Un punto justo debajo del borde entre la franja de color y el blanco
    // (a 1,4 px del video): nítido, es blanco.
    const belowEdge = pointIn(video, 0.75, 1 / 6 + 0.006);
    await expectColorAt(page, belowEdge, isUntinted);

    // Un trazo de desenfoque por ese borde, con el video en marcha.
    await bar.getByRole("button", { name: "Reproducir" }).click();
    await drag(
      page,
      [pointIn(video, 0.6, 1 / 6), pointIn(video, 0.9, 1 / 6)],
      isMobile
    );
    if (!isMobile) await page.mouse.move(2, 2);
    await expect(bar.getByRole("button", { name: "Reproducir" })).toBeVisible();
    expect(await currentTime(page)).toBeLessThan(VIDEO.duration - 0.1);

    // Desenfocado, ese blanco se mezcla con el color de la franja del
    // momento: rojo en el primer segundo y azul en el segundo.
    await seekTo(page, 0.25);
    await expectColorAt(page, belowEdge, isReddish);
    await seekTo(page, 0.75);
    await expectColorAt(page, belowEdge, isBluish);
  });

  test("una foto no tiene barra de reproducción", async ({ page }) => {
    await openPhoto(page);
    await expect(playbackBar(page)).toHaveCount(0);
  });
});
