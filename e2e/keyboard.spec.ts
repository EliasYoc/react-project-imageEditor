import { expect, test } from "@playwright/test";
import {
  documentRect,
  drag,
  expectColorAt,
  isDark,
  isWhite,
  openBlankCanvas,
  pointIn,
} from "./helpers";

// Los atajos y el recorrido con Tab son de teclado físico (escritorio).
test.skip(({ isMobile }) => isMobile, "Solo con teclado físico");

test.describe("Teclado", () => {
  test.beforeEach(async ({ page }) => {
    await openBlankCanvas(page);
  });

  test("Tab recorre la cabecera y Escape cierra el panel", async ({ page }) => {
    // Deshacer y Rehacer están deshabilitados: el recorrido empieza en el modo.
    await page.getByRole("radio", { name: "Dibujar" }).focus();
    await page.keyboard.press("Tab");
    const backdrop = page.getByRole("button", { name: "Fondo" });
    await expect(backdrop).toBeFocused();

    await page.keyboard.press("Enter");
    const panel = page.getByRole("dialog", { name: "Fondo" });
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    // El foco vuelve al botón que abrió el panel.
    await expect(backdrop).toBeFocused();

    // «Fondo» y «Más opciones» son una sola barra: se pasa de uno a otro con
    // las flechas, no con Tab.
    await page.keyboard.press("ArrowRight");
    const more = page.getByRole("button", {
      name: "Más opciones",
      exact: true,
    });
    await expect(more).toBeFocused();

    // Enter abre el menú con el foco en la primera opción: Exportar.
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Exportar" })
    ).toBeFocused();
    await page.keyboard.press("Enter");
    const exportDialog = page.getByRole("dialog", { name: "Exportar imagen" });
    await expect(exportDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(exportDialog).toBeHidden();
  });

  test("la barra de herramientas es una sola parada de Tab y se recorre con flechas", async ({
    page,
  }) => {
    const tools = page.getByRole("toolbar", { name: "Herramientas de dibujo" });
    const brush = tools.getByRole("button", { name: /^Pincel:/ });
    const eraser = tools.getByRole("button", { name: /^Borrador:/ });
    const color = tools.getByRole("button", { name: "Color del pincel" });

    await brush.focus();
    await page.keyboard.press("ArrowRight");
    await expect(eraser).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(color).toBeFocused();

    // Tab sale de la barra: el borrador y el pincel no son paradas aparte.
    await page.keyboard.press("Tab");
    await expect(tools.locator(":focus")).toHaveCount(0);
    await page.keyboard.press("Shift+Tab");
    await expect(color).toBeFocused();
  });

  test("Ctrl+S abre Exportar y ? la lista de atajos", async ({ page }) => {
    await page.keyboard.press("Control+s");
    const exportDialog = page.getByRole("dialog", { name: "Exportar imagen" });
    await expect(exportDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(exportDialog).toBeHidden();

    await page.keyboard.press("?");
    const shortcuts = page.getByRole("dialog", { name: "Atajos de teclado" });
    await expect(shortcuts).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(shortcuts).toBeHidden();
  });

  test("O oculta y vuelve a mostrar las barras", async ({ page }) => {
    const undo = page.getByRole("button", { name: "Deshacer" });
    await expect(undo).toBeVisible();
    await page.keyboard.press("o");
    await expect(undo).toBeHidden();
    await page.keyboard.press("o");
    await expect(undo).toBeVisible();
  });

  test("B, E, [ y ] cambian la herramienta y el tamaño", async ({ page }) => {
    const pen = page.getByRole("button", { name: "Pincel: Pluma" });
    const eraser = page.getByRole("button", {
      name: "Borrador: Borrador duro",
    });
    await page.keyboard.press("e");
    await expect(eraser).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("b");
    await expect(pen).toHaveAttribute("aria-pressed", "true");

    const slider = page.getByRole("slider", { name: "Tamaño del pincel" });
    await page.keyboard.press("]");
    await expect(slider).toHaveAttribute("aria-valuetext", "20 px");
    await page.keyboard.press("[");
    await expect(slider).toHaveAttribute("aria-valuetext", "16 px");
  });

  test("Ctrl+Z deshace y Ctrl+Shift+Z rehace", async ({ page }) => {
    const doc = await documentRect(page);
    const middle = pointIn(doc, 0.5, 0.5);
    await drag(page, [pointIn(doc, 0.3, 0.5), pointIn(doc, 0.7, 0.5)], false);
    await expectColorAt(page, middle, isDark);

    await page.keyboard.press("Control+z");
    await expectColorAt(page, middle, isWhite);
    await page.keyboard.press("Control+Shift+z");
    await expectColorAt(page, middle, isDark);
  });
});
