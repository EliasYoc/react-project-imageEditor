import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TextElement } from "../../editor/model/types";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { selectSelectedText } from "../../editor/store/selectors";
import FontPicker from "./components/FontPicker/FontPicker";
import TextPanel from "./components/TextPanel/TextPanel";
import TextToolbar from "./components/TextToolbar/TextToolbar";
import TextStylePanel from "./components/TextStylePanel/TextStylePanel";
import { DEFAULT_TEXT_GRADIENT } from "./constants/textGradientPresets";

// Las fuentes no se descargan en los tests.
vi.mock("../../editor/elements/fontLoader", () => ({
  ensureFont: vi.fn().mockResolvedValue(true),
  isFontReady: () => true,
}));

// Konva no puede crear un lienzo en jsdom: la vista previa se sustituye por un
// marcador (lo que dibuja se comprueba en el e2e).
vi.mock("./components/TextPreview/TextPreview", async () => {
  const { createElement } = await import("react");
  return {
    default: () =>
      createElement("div", {
        role: "img",
        "aria-label": "Vista previa del texto",
      }),
  };
});

const text = () => selectSelectedText(editorStore.getState()) as TextElement;

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "text" });
  editorStore.getState().addText({ x: 0, y: 0 }, 100);
});

describe("FontPicker", () => {
  it("muestra cada fuente en su tipo, marca la actual y la cambia", async () => {
    const { rerender } = render(<FontPicker text={text()} />);
    expect(screen.getByRole("button", { name: "Sistema" })).toBeInTheDocument();
    const pacifico = screen.getByRole("button", { name: "Pacifico" });
    expect(pacifico.style.fontFamily).toContain("Pacifico");

    await userEvent.click(pacifico);
    expect(text().fontId).toBe("pacifico");
    rerender(<FontPicker text={text()} />);
    expect(screen.getByRole("button", { name: "Pacifico" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

describe("TextPanel", () => {
  it("cambia el grosor entre normal y negrita", async () => {
    render(<TextPanel text={text()} />);
    // Grosor es un grupo de radio (hay otro "Normal": la fuente del sistema).
    const weights = screen.getByRole("radiogroup", { name: "Grosor" });
    await userEvent.click(
      within(weights).getByRole("radio", { name: "Negrita" })
    );
    expect(text().fontWeight).toBe(900);
  });

  it("alinea el texto", async () => {
    render(<TextPanel text={text()} />);
    await userEvent.click(screen.getByRole("radio", { name: "Centrar" }));
    expect(text().align).toBe("center");
  });

  it("junta fuente y estilo: vista previa arriba, grosor y alineación, fuentes y la sección «Estilo»", () => {
    render(<TextPanel text={text()} />);
    const preview = screen.getByRole("img", { name: "Vista previa del texto" });
    const weights = screen.getByRole("radiogroup", { name: "Grosor" });
    expect(
      preview.compareDocumentPosition(weights) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(weights).toBeVisible();
    expect(
      screen.getByRole("radiogroup", { name: "Alineación" })
    ).toBeVisible();
    expect(screen.getByRole("group", { name: "Fuentes" })).toBeVisible();
    const style = screen.getByRole("region", { name: "Estilo" });
    expect(
      within(style).getByRole("slider", { name: "Interlineado" })
    ).toBeVisible();
    for (const effect of ["Degradado", "Contorno", "Sombra", "Caja de fondo"]) {
      expect(
        within(style).getByRole("checkbox", { name: effect })
      ).toBeVisible();
    }
  });
});

describe("TextStylePanel", () => {
  it("activar el contorno muestra sus ajustes; el grosor es un solo paso del historial", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    expect(screen.queryByRole("slider", { name: "Grosor" })).toBeNull();

    await userEvent.click(screen.getByRole("checkbox", { name: "Contorno" }));
    expect(text().stroke.isEnabled).toBe(true);
    rerender(<TextStylePanel text={text()} />);

    const pastBefore = editorStore.getState().past.length;
    const widthBefore = text().stroke.width;
    screen.getByRole("slider", { name: "Grosor" }).focus();
    for (let step = 0; step < 3; step++) {
      await userEvent.keyboard("{ArrowRight}");
      rerender(<TextStylePanel text={text()} />);
    }
    expect(text().stroke.width).toBeCloseTo(widthBefore + 0.03);
    expect(editorStore.getState().past.length).toBe(pastBefore + 1);
  });

  it("caja de fondo: activarla y cambiar el margen", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Caja de fondo" })
    );
    rerender(<TextStylePanel text={text()} />);
    screen.getByRole("slider", { name: "Margen" }).focus();
    await userEvent.keyboard("{End}");
    expect(text().background).toMatchObject({ isEnabled: true, padding: 0.8 });
  });

  it("degradado: activarlo, cambiar la forma y recuperarlo al reactivarlo", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    const toggle = screen.getByRole("checkbox", { name: "Degradado" });
    expect(text().gradient).toBeNull();

    await userEvent.click(toggle);
    expect(text().gradient).toEqual(DEFAULT_TEXT_GRADIENT);
    rerender(<TextStylePanel text={text()} />);

    // Solo lineal y radial: el texto no admite cónico.
    const shapes = screen.getByRole("radiogroup", {
      name: "Forma del degradado",
    });
    expect(within(shapes).getAllByRole("radio")).toHaveLength(2);
    await userEvent.click(screen.getByRole("radio", { name: "Radial" }));
    expect(text().gradient?.type).toBe("radial");
    rerender(<TextStylePanel text={text()} />);
    // Radial: no hay ángulo.
    expect(screen.queryByRole("slider", { name: "Ángulo" })).toBeNull();

    await userEvent.click(toggle);
    expect(text().gradient).toBeNull();
    rerender(<TextStylePanel text={text()} />);
    await userEvent.click(toggle);
    expect(text().gradient?.type).toBe("radial");
  });

  it("degradado: girar el dial con el teclado es un solo paso del historial", async () => {
    editorStore.getState().editElement(text().id, {
      gradient: { ...DEFAULT_TEXT_GRADIENT, type: "linear", angle: 90 },
    });
    const { rerender } = render(<TextStylePanel text={text()} />);
    const pastBefore = editorStore.getState().past.length;

    screen.getByRole("slider", { name: "Ángulo" }).focus();
    for (let step = 0; step < 3; step++) {
      await userEvent.keyboard("{ArrowRight}");
      // En la app, el panel se vuelve a renderizar con el texto del store.
      rerender(<TextStylePanel text={text()} />);
    }
    expect(text().gradient?.angle).toBe(93);
    expect(editorStore.getState().past.length).toBe(pastBefore + 1);
  });

  it("degradado: «Quitar parada» va justo debajo de la barra de paradas, antes del color", () => {
    editorStore.getState().editElement(text().id, {
      gradient: DEFAULT_TEXT_GRADIENT,
    });
    render(<TextStylePanel text={text()} />);
    const stop = screen.getAllByRole("slider", { name: /parada/i })[0];
    const remove = screen.getByRole("button", { name: "Quitar parada" });
    const color = screen.getByRole("button", { name: "Color de la parada" });
    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(stop, remove)).toBe(true);
    expect(before(remove, color)).toBe(true);
  });

  it("degradado: un preset reemplaza las paradas", async () => {
    editorStore.getState().editElement(text().id, {
      gradient: DEFAULT_TEXT_GRADIENT,
    });
    render(<TextStylePanel text={text()} />);
    const presets = screen.getByRole("group", { name: "Degradados" });
    // Sin cónicos ni la viñeta.
    expect(
      Array.from(presets.querySelectorAll("button")).map(
        (button) => button.title
      )
    ).not.toContain("Arcoíris");
    await userEvent.click(screen.getByRole("button", { name: "Océano" }));
    expect(text().gradient?.stops[0].color).toEqual({
      r: 33,
      g: 147,
      b: 176,
      a: 1,
    });
  });
});

describe("TextToolbar", () => {
  it("un solo botón abre «Fuente y estilo»; ya no hay un botón aparte de estilo", async () => {
    const user = userEvent.setup();
    render(<TextToolbar />);
    expect(
      screen.queryByRole("button", { name: "Estilo del texto" })
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /^Fuente:/ }));
    const panel = await screen.findByRole("dialog", {
      name: "Fuente y estilo",
    });
    expect(within(panel).getByRole("region", { name: "Estilo" })).toBeVisible();
  });

  it("«Insertar archivo» está en el menú «Más opciones» y abre el selector de archivos", async () => {
    const user = userEvent.setup();
    const { container } = render(<TextToolbar />);
    expect(
      screen.queryByRole("button", { name: "Insertar archivo" })
    ).toBeNull();

    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]'
    ) as HTMLInputElement;
    const openPicker = vi.spyOn(input, "click");

    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    await user.click(
      screen.getByRole("menuitem", { name: "Insertar archivo" })
    );
    expect(openPicker).toHaveBeenCalledOnce();
  });

  it("«¿Qué puedo insertar?», encima de «Insertar archivo», explica los tipos de archivo", async () => {
    const user = userEvent.setup();
    render(<TextToolbar />);
    await user.click(screen.getByRole("button", { name: "Más opciones" }));
    const items = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    expect(items).toEqual(["¿Qué puedo insertar?", "Insertar archivo"]);
    expect(screen.getByRole("separator")).toBeInTheDocument();

    await user.click(
      screen.getByRole("menuitem", { name: "¿Qué puedo insertar?" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "¿Qué puedo insertar?",
    });
    for (const kind of [
      /^Imágenes/,
      /^GIFs/,
      /^Stickers Lottie/,
      /^Stickers de Telegram/,
    ]) {
      expect(within(dialog).getByRole("region", { name: kind })).toBeVisible();
    }
    // Las webs para conseguir stickers se abren en otra pestaña.
    expect(
      within(dialog).getByRole("link", { name: "LottieFiles" })
    ).toHaveAttribute("target", "_blank");
  });
});
