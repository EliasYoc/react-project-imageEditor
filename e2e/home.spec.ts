import { expect, test, type Page } from "@playwright/test";
import {
  colorDistance,
  documentRect,
  drag,
  expectColorAt,
  expectDocumentVisible,
  isDark,
  isWhite,
  openBlankCanvas,
  openPhoto,
  pointIn,
  screenColor,
  stageRect,
} from "./helpers";

const BLUE = { r: 0, g: 122, b: 255 };

/** Una imagen azul de 300 × 200 creada en la página, como un File. */
const createImageFile = (page: Page) =>
  page.evaluateHandle(async (color) => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sin contexto 2D");
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("No se creó la imagen");
    return new File([blob], "azul.png", { type: "image/png" });
  }, BLUE);

/** El centro del lienzo se ve azul (la imagen abierta). */
const expectBlueCanvas = async (page: Page) => {
  const stage = await stageRect(page);
  const center = {
    x: stage.x + stage.width / 2,
    y: stage.y + stage.height / 2,
  };
  await expect
    .poll(() => screenColor(page, center).then((c) => colorDistance(c, BLUE)))
    .toBeLessThan(12);
};

test.describe("Inicio", () => {
  test("empieza un lienzo en blanco del tamaño elegido", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeVisible();
    // Sin documento no hay nada que seguir editando.
    await expect(
      page.getByRole("button", { name: "Seguir editando" })
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Horizontal, 1920 × 1080 píxeles" })
      .click();
    await expectDocumentVisible(page);
    const doc = await documentRect(page);
    expect(doc.width / doc.height).toBeCloseTo(1920 / 1080, 1);

    await page.getByRole("button", { name: "Exportar" }).click();
    await expect(
      page.getByRole("dialog", { name: "Exportar imagen" })
    ).toContainText("Se guarda a 1920 × 1080 px.");
  });

  test("abre una foto con el botón", async ({ page }) => {
    await openPhoto(page);
    // La foto de prueba es negra a la izquierda y blanca a la derecha.
    const stage = await stageRect(page);
    const center = {
      x: stage.x + stage.width / 2,
      y: stage.y + stage.height / 2,
    };
    await expectColorAt(page, { ...center, x: center.x - 40 }, isDark);
    await expectColorAt(page, { ...center, x: center.x + 40 }, isWhite);

    await page.getByRole("button", { name: "Exportar" }).click();
    const dialog = page.getByRole("dialog", { name: "Exportar imagen" });
    await expect(dialog).toContainText("la resolución de la foto original");
    await expect(
      dialog.getByRole("textbox", { name: "Nombre del archivo" })
    ).toHaveValue("foto-editada");
  });

  test("abre una imagen al soltarla", async ({ page }) => {
    await page.goto("/");
    const file = await createImageFile(page);
    const dataTransfer = await page.evaluateHandle((image) => {
      const transfer = new DataTransfer();
      transfer.items.add(image);
      return transfer;
    }, file);

    await page.dispatchEvent("body", "dragenter", { dataTransfer });
    await expect(page.getByText("Suelta la imagen para abrirla")).toBeVisible();
    await page.dispatchEvent("body", "drop", { dataTransfer });
    await expectBlueCanvas(page);
  });

  test("abre una imagen al pegarla", async ({ page }) => {
    await page.goto("/");
    const file = await createImageFile(page);
    await page.evaluate((image) => {
      const clipboardData = new DataTransfer();
      clipboardData.items.add(image);
      window.dispatchEvent(new ClipboardEvent("paste", { clipboardData }));
    }, file);
    await expectBlueCanvas(page);
  });

  test("pide confirmación antes de descartar el documento", async ({
    page,
    isMobile,
  }) => {
    await openBlankCanvas(page);
    const doc = await documentRect(page);
    const middle = pointIn(doc, 0.5, 0.5);
    await drag(
      page,
      [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)],
      isMobile
    );
    await expectColorAt(page, middle, isDark);

    const close = page.getByRole("button", { name: "Cerrar el editor" });
    const story = page.getByRole("button", { name: /^Historia,/ });
    const confirm = page.getByRole("alertdialog", {
      name: "¿Empezar de nuevo?",
    });

    // Cancelar: el dibujo sigue ahí.
    await close.click();
    await story.click();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(confirm).toBeHidden();
    await page.getByRole("button", { name: "Seguir editando" }).click();
    await expectColorAt(page, middle, isDark);

    // Descartar: lienzo nuevo, sin el dibujo ni su historial.
    await close.click();
    await story.click();
    await confirm.getByRole("button", { name: "Descartar y abrir" }).click();
    await expectDocumentVisible(page);
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();
    const newDoc = await documentRect(page);
    expect(newDoc.width / newDoc.height).toBeCloseTo(1080 / 1920, 1);
  });
});
