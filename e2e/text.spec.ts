import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  countPixels,
  documentRect,
  drag,
  isColorful,
  isDark,
  isWhite,
  openBlankCanvas,
  pinch,
  pointIn,
  screenColor,
  screenPixels,
  stageRect,
  tapAt,
  type Point,
  type Rect,
  type Rgba,
} from "./helpers";

const isLight = ({ r, g, b }: Rgba) => r > 200 && g > 200 && b > 200;

/**
 * Espera a que el editor llegue a su sitio: al volver a editar un texto, sale
 * de donde está el texto en el lienzo con una transición.
 */
const waitForEditorAtRest = (editor: Locator) =>
  expect
    .poll(() => editor.evaluate((element) => element.getAnimations().length))
    .toBe(0);

const centerOf = ({ x, y, width, height }: Rect): Point => ({
  x: x + width / 2,
  y: y + height / 2,
});

/** El mismo rectángulo, movido lo que va de un punto a otro. */
const shifted = (area: Rect, from: Point, to: Point): Rect => ({
  ...area,
  x: area.x + to.x - from.x,
  y: area.y + to.y - from.y,
});

/** El rectángulo más pequeño que contiene todos los píxeles oscuros de `area`. */
const darkBounds = async (page: Page, area: Rect) => {
  const pixels = await screenPixels(page, area);
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (!isDark(pixels.at(x, y))) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return {
    left: area.x + left,
    right: area.x + right,
    top: area.y + top,
    bottom: area.y + bottom,
  };
};

/**
 * Añade un texto con lo escrito y toca fuera para terminar. Devuelve dónde
 * quedó: el sitio donde estaba el editor mientras se escribía (un texto nuevo
 * se queda donde se escribe, no donde se crea).
 */
const addText = async (page: Page, doc: Rect, touch: boolean) => {
  await page.getByRole("button", { name: "Agregar texto" }).click();
  const editor = page.getByRole("textbox", { name: "Texto" });
  await expect(editor).toBeFocused();
  await page.keyboard.type("Hola");
  const where = (await editor.boundingBox()) as Rect;
  // Tocar el fondo confirma el texto y quita la selección.
  await tapAt(page, pointIn(doc, 0.5, 0.9), touch);
  await expect(editor).toBeHidden();
  return where;
};

/** Ancho de las letras (lo oscuro) dentro de `area`. */
const textWidth = async (page: Page, doc: Rect) => {
  const bounds = await darkBounds(page, doc);
  return bounds.right - bounds.left;
};

/**
 * No hubo zoom: el borde de arriba del documento sigue en su sitio (blanco
 * justo debajo, el fondo de la app justo encima).
 */
const expectNoZoom = async (page: Page, doc: Rect) => {
  const edgeX = doc.x + 10;
  expect(isWhite(await screenColor(page, { x: edgeX, y: doc.y + 3 }))).toBe(
    true
  );
  expect(isWhite(await screenColor(page, { x: edgeX, y: doc.y - 3 }))).toBe(
    false
  );
};

test.describe("Texto", () => {
  test.beforeEach(async ({ page }) => {
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("añade un texto y lo vuelve a editar", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const center = centerOf(where);
    await expect
      .poll(() => countPixels(page, where, isDark))
      .toBeGreaterThan(50);

    // Doble clic (o tocar un texto ya seleccionado) abre su editor.
    if (isMobile) {
      await tapAt(page, center, true);
      await tapAt(page, center, true);
    } else {
      await page.mouse.dblclick(center.x, center.y);
    }
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toHaveValue("Hola");
    // El cursor queda al final y no se selecciona el texto.
    expect(
      await editor.evaluate((element: HTMLTextAreaElement) => [
        element.selectionStart,
        element.selectionEnd,
      ])
    ).toEqual([4, 4]);
  });

  test("un texto nuevo queda donde se escribió", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    await page.getByRole("button", { name: "Agregar texto" }).click();
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();
    await page.keyboard.type("Hola");
    const box = (await editor.boundingBox()) as Rect;
    const area: Rect = {
      x: box.x - 12,
      y: box.y - 12,
      width: box.width + 24,
      height: box.height + 24,
    };
    // Dónde se ven las letras mientras se escribe.
    const typed = await darkBounds(page, area);

    await tapAt(page, pointIn(doc, 0.5, 0.9), isMobile);
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, area, isDark))
      .toBeGreaterThan(50);

    // Ya como texto del lienzo, las letras están en el mismo sitio (con un
    // margen: el navegador y Konva no dibujan la letra idéntica).
    const placed = await darkBounds(page, area);
    for (const side of ["left", "right", "top", "bottom"] as const) {
      expect(Math.abs(placed[side] - typed[side])).toBeLessThanOrEqual(4);
    }
  });

  test("un texto largo no pasa del 90 % del lienzo: se reparte en líneas, escribiéndolo y ya confirmado", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const maxWidth = doc.width * 0.9;
    await page.getByRole("button", { name: "Agregar texto" }).click();
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();
    await page.keyboard.type(
      "Un texto largo que debe repartirse en varias líneas al llegar al noventa por ciento del ancho del lienzo"
    );

    // Escribiéndolo, el editor llega al máximo (no lo pasa) y ocupa varias
    // líneas. Un margen de 3 píxeles: `documentRect` mide el documento un par
    // de píxeles más estrecho de lo que es (sus bordes salen suavizados).
    const box = (await editor.boundingBox()) as Rect;
    expect(box.width).toBeLessThanOrEqual(maxWidth + 3);
    expect(box.width).toBeGreaterThan(maxWidth - 2);
    expect(box.height).toBeGreaterThan(0.2 * Math.min(doc.width, doc.height));

    // Ya confirmado, el texto del lienzo ocupa el mismo sitio: nada fuera del
    // 90 % (a los lados), letras hasta cerca de su borde derecho y en varias
    // líneas. Se miran franjas finas: contar píxeles en todo el documento
    // tarda unos 10 s en escritorio.
    await tapAt(page, pointIn(doc, 0.1, 0.97), isMobile);
    await expect(editor).toBeHidden();
    const rows = { y: box.y, height: box.height };
    const innerRight: Rect = {
      x: box.x + box.width * 0.75,
      width: box.width * 0.25,
      ...rows,
    };
    await expect
      .poll(() => countPixels(page, innerRight, isDark))
      .toBeGreaterThan(20);
    const outsideLeft: Rect = {
      x: doc.x,
      width: box.x - 3 - doc.x,
      ...rows,
    };
    const outsideRight: Rect = {
      x: box.x + box.width + 3,
      width: doc.x + doc.width - (box.x + box.width + 3),
      ...rows,
    };
    expect(await countPixels(page, outsideLeft, isDark)).toBe(0);
    expect(await countPixels(page, outsideRight, isDark)).toBe(0);
    // Varias líneas: hay letras en la franja de la izquierda a lo alto de
    // casi toda la caja.
    const firstLetters = await darkBounds(page, {
      x: box.x,
      width: 30,
      ...rows,
    });
    expect(firstLetters.bottom - firstLetters.top).toBeGreaterThan(
      0.2 * Math.min(doc.width, doc.height)
    );
  });

  test("al editar un texto lejos, el editor sale centrado y arriba, y el texto vuelve a su sitio", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const start = centerOf(where);
    const far = pointIn(doc, 0.75, 0.8);
    await drag(page, [start, far], isMobile);
    const moved = shifted(where, start, far);
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);

    // Se edita desde donde está. Tras arrastrarlo ya está seleccionado: en el
    // móvil basta un toque (un segundo caería fuera del editor y lo cerraría).
    if (isMobile) {
      await tapAt(page, far, true);
    } else {
      await page.mouse.dblclick(far.x, far.y);
    }
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();
    await waitForEditorAtRest(editor);

    // Sale centrado en horizontal y por encima de donde estaba el texto.
    const stage = await stageRect(page);
    const box = (await editor.boundingBox()) as Rect;
    expect(
      Math.abs(box.x + box.width / 2 - (stage.x + stage.width / 2))
    ).toBeLessThan(3);
    expect(box.y + box.height).toBeLessThan(far.y);

    // Al terminar, el texto sigue donde estaba (y no donde se escribió).
    await tapAt(page, pointIn(doc, 0.15, 0.15), isMobile);
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, where, isDark)).toBe(0);
  });

  test("aplica un degradado al texto", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const area = await addText(page, doc, isMobile);
    // Negro: sin color todavía.
    await expect
      .poll(() => countPixels(page, area, isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, area, isColorful)).toBeLessThan(10);

    await tapAt(page, centerOf(area), isMobile);
    await page.getByRole("button", { name: /^Fuente:/ }).click();
    const panel = page.getByRole("dialog", { name: "Fuente y estilo" });
    await panel.getByRole("checkbox", { name: "Degradado" }).check();
    await panel.getByRole("button", { name: "Cerrar" }).click();
    // Hasta que no termina de cerrarse, la hoja sigue encima del lienzo y un
    // toque cae sobre ella (aquí desmarcaría el degradado).
    await expect(panel).toBeHidden();
    // Sin selección: el marco azul no cuenta como color del texto.
    await tapAt(page, pointIn(doc, 0.5, 0.9), isMobile);

    await expect
      .poll(() => countPixels(page, area, isColorful))
      .toBeGreaterThan(50);
  });

  test("la vista previa del panel muestra el texto y su estilo, y el fondo se oscurece", async ({
    page,
    isMobile,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    await tapAt(page, centerOf(where), isMobile);
    await page.getByRole("button", { name: /^Fuente:/ }).click();
    const panel = page.getByRole("dialog", { name: "Fuente y estilo" });
    const preview = panel.getByRole("img", { name: "Vista previa del texto" });
    const previewRect = async () => (await preview.boundingBox()) as Rect;
    // Un punto del fondo, sin letras y dentro de las esquinas redondeadas.
    const backdrop = async () => {
      const { x, y } = await previewRect();
      return screenColor(page, { x: x + 24, y: y + 10 });
    };

    // Por defecto, texto negro en una caja blanca: la caja no se vería sobre
    // blanco, así que la vista previa usa el fondo gris oscuro. La caja (blanca
    // al 60 % sobre ese gris) queda en un gris medio.
    const isBoxOnDark = ({ r, g, b }: Rgba) =>
      Math.min(r, g, b) > 140 && Math.max(r, g, b) < 200;
    await expect.poll(async () => isDark(await backdrop())).toBe(true);
    await expect
      .poll(async () => countPixels(page, await previewRect(), isBoxOnDark))
      .toBeGreaterThan(50);

    // Sin la caja, el texto negro se ve sobre blanco: el fondo se aclara.
    await panel.getByRole("checkbox", { name: "Caja de fondo" }).uncheck();
    await expect.poll(async () => isLight(await backdrop())).toBe(true);
    await expect
      .poll(async () => countPixels(page, await previewRect(), isDark))
      .toBeGreaterThan(50);

    await panel.getByRole("checkbox", { name: "Degradado" }).check();
    await expect
      .poll(async () => countPixels(page, await previewRect(), isColorful))
      .toBeGreaterThan(50);
  });

  test("un texto agrandado se edita al tamaño de uno nuevo y vuelve con su tamaño", async ({
    page,
    isMobile,
  }) => {
    // Lee muchos píxeles de pantalla: con toda la suite en paralelo, en
    // escritorio no le bastan 30 s.
    test.slow();
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const center = centerOf(where);
    // Solo la franja del texto (crece hacia abajo y a la derecha): medir
    // todo el documento es lento en escritorio.
    const band = {
      x: where.x,
      width: doc.x + doc.width - where.x,
      y: where.y,
      height: Math.min(where.height * 3, doc.y + doc.height - where.y),
    };
    // El texto se pinta en el siguiente frame: sin él, el ancho sería NaN.
    await expect.poll(() => textWidth(page, band)).toBeGreaterThan(0);
    const original = await textWidth(page, band);
    await tapAt(page, center, isMobile); // lo selecciona
    const slider = page.getByRole("slider", { name: "Tamaño del texto" });
    // Cada RePág sube un paso del slider (86 → 110 px con dos).
    for (let press = 0; press < 4; press++) await slider.press("PageUp");
    await expect
      .poll(() => textWidth(page, band))
      .toBeGreaterThan(original * 1.5);
    const enlarged = await textWidth(page, band);

    // Tocar el texto ya seleccionado abre su editor.
    await tapAt(page, center, isMobile);
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toHaveValue("Hola");
    await waitForEditorAtRest(editor);
    const box = (await editor.boundingBox()) as Rect;
    // Con un margen: el de la caja se redondea a píxeles enteros.
    expect(Math.abs(box.height - where.height)).toBeLessThan(2);

    await tapAt(page, pointIn(doc, 0.5, 0.97), isMobile);
    await expect(editor).toBeHidden();
    await expect.poll(() => textWidth(page, band)).toBeCloseTo(enlarged, 0);
  });

  test("mueve el texto arrastrándolo", async ({ page, isMobile }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, isMobile);
    const start = centerOf(where);

    const target = pointIn(doc, 0.5, 0.75);
    await drag(page, [start, target], isMobile);
    await expect
      .poll(() => countPixels(page, shifted(where, start, target), isDark))
      .toBeGreaterThan(50);
    expect(await countPixels(page, where, isDark)).toBe(0);
  });
});

test.describe("Texto con dos dedos", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "El pellizco con dos dedos es del móvil");
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("pellizcar el texto seleccionado lo agranda, sin zoom ni abrir su editor", async ({
    page,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, true);
    const center = centerOf(where);
    await tapAt(page, center, true); // lo selecciona
    const before = await textWidth(page, doc);

    await pinch(page, center, 40, 120);

    await expect.poll(() => textWidth(page, doc)).toBeGreaterThan(before * 2);
    await expectNoZoom(page, doc);
    await expect(page.getByRole("textbox", { name: "Texto" })).toBeHidden();
  });

  test("un dedo arrastra el texto sin seleccionar y un segundo dedo, fuera de él, lo agranda", async ({
    page,
  }) => {
    const doc = await documentRect(page);
    const where = await addText(page, doc, true);
    const center = centerOf(where);
    const before = await textWidth(page, doc);

    const cdp = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      points: Point[]
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: points.map((point, id) => ({ ...point, id })),
      });
    // El primer dedo selecciona el texto y lo arrastra un poco, sin soltarlo.
    let first = { x: center.x - 10, y: center.y };
    await touch("touchStart", [first]);
    for (let step = 1; step <= 5; step++) {
      first = { x: center.x - 10 - step * 2, y: center.y };
      await touch("touchMove", [first]);
    }
    // El segundo dedo cae fuera del texto y los dos se separan.
    const second = { x: center.x + 80, y: center.y };
    await touch("touchStart", [first, second]);
    for (let step = 1; step <= 12; step++) {
      await touch("touchMove", [
        { x: first.x - step * 8, y: first.y },
        { x: second.x + step * 8, y: second.y },
      ]);
    }
    await touch("touchEnd", []);
    await cdp.detach();

    await expect.poll(() => textWidth(page, doc)).toBeGreaterThan(before * 2);
    await expectNoZoom(page, doc);
  });
});

/** Cuánto se diferencian dos colores (el canal que más cambia). */
const colorChange = (a: Rgba, b: Rgba) =>
  Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

test("mientras se escribe, una capa tapa el lienzo, y al terminar se quita", async ({
  page,
  isMobile,
}) => {
  // Con la caja de fondo por defecto, la capa es oscura: el lienzo en blanco
  // se oscurece.
  await openBlankCanvas(page);
  await page.getByRole("radio", { name: "Texto" }).click();
  const doc = await documentRect(page);
  // Por debajo del editor y por encima de la barra de abajo.
  const probe = pointIn(doc, 0.3, 0.7);
  const before = await screenColor(page, probe);

  await page.getByRole("button", { name: "Agregar texto" }).click();
  const editor = page.getByRole("textbox", { name: "Texto" });
  await expect(editor).toBeFocused();
  await expect
    .poll(async () => colorChange(await screenColor(page, probe), before))
    .toBeGreaterThan(30);

  await page.keyboard.type("Hola");
  // Tocar la capa confirma el texto.
  await tapAt(page, probe, isMobile);
  await expect(editor).toBeHidden();
  await expect
    .poll(async () => colorChange(await screenColor(page, probe), before))
    .toBeLessThan(5);
});

test.describe("Texto con el teclado del móvil", () => {
  /** Alto del teclado falso, en píxeles (como el de un móvil, con sugerencias). */
  const KEYBOARD_HEIGHT = 340;

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "El teclado virtual es del móvil");
    // Playwright no abre teclado: un visualViewport falso que se encoge al
    // "abrirlo" y avisa con resize, como el del navegador.
    await page.addInitScript(() => {
      const viewport = new EventTarget();
      let keyboardHeight = 0;
      Object.defineProperties(viewport, {
        offsetTop: { get: () => 0 },
        offsetLeft: { get: () => 0 },
        width: { get: () => window.innerWidth },
        height: { get: () => window.innerHeight - keyboardHeight },
        scale: { get: () => 1 },
      });
      Object.defineProperty(window, "visualViewport", { value: viewport });
      Object.defineProperty(window, "openFakeKeyboard", {
        value: (height: number) => {
          keyboardHeight = height;
          viewport.dispatchEvent(new Event("resize"));
        },
      });
    });
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("un texto largo no queda debajo del teclado: el editor sube y, si no cabe, se desplaza por dentro", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Agregar texto" }).click();
    const editor = page.getByRole("textbox", { name: "Texto" });
    await expect(editor).toBeFocused();
    await page.evaluate((height) => {
      (
        window as unknown as { openFakeKeyboard: (height: number) => void }
      ).openFakeKeyboard(height);
    }, KEYBOARD_HEIGHT);
    const keyboardTop =
      (await page.evaluate(() => window.innerHeight)) - KEYBOARD_HEIGHT;
    const editorBox = async () => (await editor.boundingBox()) as Rect;

    // Unas líneas: el editor sube para que la última se vea.
    await page.keyboard.insertText("Una línea\n".repeat(6));
    let box = await editorBox();
    expect(box.y + box.height).toBeLessThanOrEqual(keyboardTop);
    expect(box.y).toBeGreaterThanOrEqual(0);

    // Muchas más: no cabe ni subiendo; se desplaza dentro y se ve el final.
    await page.keyboard.insertText("Otra línea\n".repeat(20));
    box = await editorBox();
    expect(box.y + box.height).toBeLessThanOrEqual(keyboardTop);
    expect(box.y).toBeGreaterThanOrEqual(0);
    const scroll = await editor.evaluate((textarea: HTMLTextAreaElement) => ({
      top: textarea.scrollTop,
      hidden: textarea.scrollHeight - textarea.clientHeight,
    }));
    expect(scroll.hidden).toBeGreaterThan(0);
    // Al final: lo que queda oculto es lo de arriba.
    expect(scroll.top).toBeGreaterThanOrEqual(scroll.hidden - 1);
  });
});

test.describe("Transición del editor de texto", () => {
  test.beforeEach(async ({ page }) => {
    await openBlankCanvas(page);
    await page.getByRole("radio", { name: "Texto" }).click();
  });

  test("un texto nuevo se abre sin transición; al volver a editarlo, el editor sale del texto y, al terminar, vuelve a él", async ({
    page,
    isMobile,
  }) => {
    const editor = page.getByRole("textbox", { name: "Texto" });
    const animations = () =>
      editor.evaluate((element) => element.getAnimations().length);
    const editorCenterX = async () => {
      const box = (await editor.boundingBox()) as Rect;
      return box.x + box.width / 2;
    };

    // Antes de abrir el editor: su capa oscurece el documento.
    const doc = await documentRect(page);

    // Un texto nuevo aparece directamente en el editor.
    await page.getByRole("button", { name: "Agregar texto" }).click();
    await expect(editor).toBeFocused();
    expect(await animations()).toBe(0);
    await page.keyboard.type("Hola");
    const where = (await editor.boundingBox()) as Rect;
    await tapAt(page, pointIn(doc, 0.5, 0.9), isMobile);
    await expect(editor).toBeHidden();

    // Se lleva lejos del sitio del editor, para ver de dónde sale.
    const start = centerOf(where);
    const far = pointIn(doc, 0.75, 0.8);
    await drag(page, [start, far], isMobile);
    const moved = shifted(where, start, far);
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);

    // A cámara lenta (× 0,05): la transición dura 4,4 s y se puede mirar a
    // mitad de camino, por lento que vaya el equipo.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Animation.enable");
    const setSpeed = (playbackRate: number) =>
      cdp.send("Animation.setPlaybackRate", { playbackRate });
    await setSpeed(0.05);

    // Tras arrastrarlo ya está seleccionado: un toque (o doble clic) lo edita.
    if (isMobile) await tapAt(page, far, true);
    else await page.mouse.dblclick(far.x, far.y);
    await expect(editor).toBeFocused();
    const stage = await stageRect(page);
    const restX = stage.x + stage.width / 2;
    // Empieza cerca del texto, no en su sitio (centrado).
    const enteringX = await editorCenterX();
    expect(Math.abs(enteringX - far.x)).toBeLessThan(
      Math.abs(enteringX - restX)
    );
    await setSpeed(1);
    await waitForEditorAtRest(editor);
    expect(Math.abs((await editorCenterX()) - restX)).toBeLessThan(3);

    // Al terminar, vuelve al texto: el editor sigue en pantalla, moviéndose.
    await setSpeed(0.05);
    await tapAt(page, pointIn(doc, 0.15, 0.15), isMobile);
    expect(await animations()).toBeGreaterThan(0);
    await expect(editor).toBeVisible();
    await setSpeed(1);
    // Al llegar, se va y el texto del lienzo vuelve a verse en su sitio.
    await expect(editor).toBeHidden();
    await expect
      .poll(() => countPixels(page, moved, isDark))
      .toBeGreaterThan(50);
    await cdp.detach();
  });
});
