import { expect, test, type Page } from "@playwright/test";
import {
  expectBothColorsAt,
  exportVideo,
  fakeShareSheet,
  fittedCenter,
  insertFile,
  isBlue,
  isRed,
  openBlankCanvas,
  openMenuItem,
  readVideo,
  type Point,
  type Rgba,
} from "./helpers";

/** GIF de prueba: 64 × 64, un fotograma rojo y otro azul de 200 ms, en bucle. */
const GIF_PATH = "e2e/fixtures/animado.gif";

/** Un fotograma del video exportado: su momento y el color de un punto. */
interface FrameColor {
  time: number;
  color: Rgba;
}

/**
 * Reproduce el video (al doble de velocidad) y apunta, en cada fotograma que
 * se pinta, su momento exacto y el color de `point`, hasta `untilSeconds`.
 *
 * Es más fiable que saltar a un momento (`readVideo`): con mucha carga, tras
 * un salto el `<video>` a veces aún muestra el fotograma anterior.
 * `requestVideoFrameCallback` da el momento del fotograma que se pinta.
 */
const readFramesWhilePlaying = (
  page: Page,
  bytes: Uint8Array,
  point: Point,
  untilSeconds: number
): Promise<FrameColor[]> =>
  page.evaluate(
    async ({ bytes, point, untilSeconds }) => {
      const video = document.createElement("video");
      video.muted = true;
      // En la página, para que el navegador pinte cada fotograma.
      video.style.cssText = "position: fixed; top: 0; left: 0; width: 64px";
      document.body.append(video);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: "video/mp4" })
      );
      video.src = url;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () =>
          reject(new Error("El navegador no puede reproducir el video"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Sin contexto 2D");

      const frames: { time: number; color: Rgba }[] = [];
      await new Promise<void>((resolve) => {
        const onFrame = (
          _now: number,
          { mediaTime }: VideoFrameCallbackMetadata
        ) => {
          ctx.drawImage(video, 0, 0);
          const [r, g, b, a] = ctx.getImageData(point.x, point.y, 1, 1).data;
          frames.push({ time: mediaTime, color: { r, g, b, a } });
          if (mediaTime >= untilSeconds) {
            video.pause();
            resolve();
          } else {
            video.requestVideoFrameCallback(onFrame);
          }
        };
        video.requestVideoFrameCallback(onFrame);
        video.playbackRate = 2;
        void video.play();
      });
      video.remove();
      URL.revokeObjectURL(url);
      return frames;
    },
    { bytes: Array.from(bytes), point, untilSeconds }
  );

/**
 * El color del GIF de prueba en un momento del video exportado (30 fps): el
 * GIF cambia cada 200 ms, es decir, cada 6 fotogramas.
 */
const gifColorAt = (seconds: number) =>
  Math.floor(Math.round(seconds * 30) / 6) % 2 === 0 ? "rojo" : "azul";

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

    await openMenuItem(page, "Exportar");
    const dialog = page.getByRole("dialog", { name: "Exportar video" });
    await expect(dialog).toContainText(
      "Se guarda en MP4 a 1080 × 1080 px, 15 segundos, sin sonido."
    );
    await expect(dialog.getByRole("radio", { name: "Video" })).toBeChecked();
    await page.keyboard.press("Escape");

    const { name, bytes } = await exportVideo(page, isMobile);
    expect(name).toMatch(/^dibujo-\d{4}-\d{2}-\d{2}\.mp4$/);
    const exported = await readVideo(page, bytes, { times: [], points: [] });
    expect(exported.width).toBe(1080);
    expect(exported.height).toBe(1080);
    expect(exported.duration).toBeCloseTo(15, 0);
    expect(exported.soundSeconds).toBe(0);

    // El GIF está en el centro del documento. En cada fotograma de los dos
    // primeros segundos sale el color que le toca en ese momento.
    const frames = await readFramesWhilePlaying(
      page,
      bytes,
      { x: 540, y: 540 },
      2
    );
    expect(frames.length).toBeGreaterThan(10);
    const wrong = frames.filter(({ time, color }) =>
      gifColorAt(time) === "rojo" ? !isRed(color) : !isBlue(color)
    );
    expect(wrong).toEqual([]);
  });
});
