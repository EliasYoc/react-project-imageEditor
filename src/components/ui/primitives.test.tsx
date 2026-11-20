import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hexToRgb, rgbaToHex } from "../../editor/model/color";
import type { Rgba } from "../../editor/model/types";
import { DESKTOP_QUERY } from "../../lib/useMediaQuery";
import { mockMediaQueries } from "../../test/media";
import { ColorControl, ColorPicker } from "./ColorControl";
import { ConfirmDialog } from "./Dialog";
import { ChoiceMenu, Menu } from "./Menu";
import { Panel } from "./Panel";
import { Segmented } from "./Segmented";
import { CardSection } from "./CardSection";
import { ColorField } from "./ColorField";
import { VerticalSlider } from "./VerticalSlider";

afterEach(() => mockMediaQueries(() => false));

const asDesktop = () => mockMediaQueries((query) => query === DESKTOP_QUERY);

const PanelHarness = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <button type="button">Fuera</button>
      <Panel open={open} onOpenChange={setOpen} title="Fondo">
        <button type="button">Dentro</button>
      </Panel>
    </>
  );
};

describe("Panel", () => {
  it("en el móvil es un diálogo modal: Escape lo cierra y el foco vuelve", async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    const opener = screen.getByRole("button", { name: "Abrir" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Fondo" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    // Modal: lo de fuera queda oculto a los lectores de pantalla.
    expect(screen.queryByRole("button", { name: "Fuera" })).toBeNull();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    // Radix devuelve el foco en el siguiente tick, al desmontar el diálogo.
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("en escritorio no es modal: tocar fuera (dibujar) no lo cierra", async () => {
    asDesktop();
    const user = userEvent.setup();
    render(<PanelHarness />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));

    const outside = screen.getByRole("button", { name: "Fuera" });
    await user.click(outside);
    expect(screen.getByRole("dialog", { name: "Fondo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("no quita el foco a lo que se usó mientras se cerraba", async () => {
    asDesktop();
    const user = userEvent.setup();
    render(<PanelHarness />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));

    // Se cierra y, antes de que Radix devuelva el foco (en el siguiente
    // tick, tras la animación), se usa otro control: p. ej. abrir el
    // selector de color justo después de cerrar los pinceles.
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    const outside = screen.getByRole("button", { name: "Fuera" });
    outside.focus();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(outside).toHaveFocus();
  });
});

describe("Menu", () => {
  it("se abre y se recorre con el teclado", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <Menu
        trigger={<button type="button">Más opciones</button>}
        items={[
          { label: "Abrir otra foto", onSelect: vi.fn() },
          {
            label: "Borrar el dibujo",
            icon: Trash2,
            onSelect: onClear,
            isDanger: true,
          },
        ]}
      />
    );
    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("ChoiceMenu", () => {
  const options = [
    { value: "circle", label: "Círculos" },
    { value: "square", label: "Cuadrados" },
    { value: "star", label: "Estrellas" },
  ] as const;

  it("marca la opción elegida y cambia con el teclado", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChoiceMenu
        trigger={<button type="button">Formas</button>}
        label="Forma"
        value="square"
        onChange={onChange}
        options={options}
      />
    );
    screen.getByRole("button", { name: "Formas" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("group", { name: "Forma" })).toBeInTheDocument();
    const checked = screen
      .getAllByRole("menuitemradio")
      .filter((item) => item.getAttribute("aria-checked") === "true");
    expect(checked.map((item) => item.textContent)).toEqual(["Cuadrados"]);

    // Enter abre con el foco en la primera opción; la flecha baja una.
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("star");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("ConfirmDialog", () => {
  it("solo confirma con el botón de confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="¿Borrar el dibujo?"
        description="Se puede deshacer."
        confirmLabel="Borrar"
        onConfirm={onConfirm}
        isDestructive
      />
    );
    const dialog = screen.getByRole("alertdialog", {
      name: "¿Borrar el dibujo?",
    });
    expect(dialog).toHaveAccessibleDescription("Se puede deshacer.");
    // El foco empieza en "Cancelar" (lo seguro).
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Borrar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("Segmented", () => {
  it("es un grupo de radio: Tab entra en la opción elegida y las flechas cambian", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Segmented
        label="Modo"
        value="draw"
        onChange={onChange}
        items={[
          { value: "draw", label: "Dibujar" },
          { value: "text", label: "Texto" },
        ]}
      />
    );
    expect(
      screen.getByRole("radiogroup", { name: "Modo" })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dibujar" })).toBeChecked();

    await user.tab();
    expect(screen.getByRole("radio", { name: "Dibujar" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Texto" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("text");
  });

  it("volver a pulsar la opción elegida no la deselecciona", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Segmented
        label="Forma"
        value="linear"
        onChange={onChange}
        items={[
          { value: "linear", label: "Lineal" },
          { value: "radial", label: "Radial" },
        ]}
      />
    );
    await user.click(screen.getByRole("radio", { name: "Lineal" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("VerticalSlider", () => {
  it("se mueve con las flechas y anuncia el valor legible", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VerticalSlider
        label="Tamaño"
        value={10}
        min={0}
        max={100}
        onChange={onChange}
        valueText="10 px"
      />
    );
    const slider = screen.getByRole("slider", { name: "Tamaño" });
    expect(slider).toHaveAttribute("aria-valuetext", "10 px");
    expect(slider).toHaveAttribute("aria-orientation", "vertical");
    slider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalledWith(11);
  });
});

describe("CardSection", () => {
  it("es una región con el nombre de su título, que usa el nivel pedido", () => {
    render(
      <CardSection title="Dibujo" headingLevel={3}>
        <button type="button">Lápiz</button>
      </CardSection>
    );
    const section = screen.getByRole("region", { name: "Dibujo" });
    expect(
      within(section).getByRole("heading", { level: 3, name: "Dibujo" })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Lápiz" })
    ).toBeInTheDocument();
  });
});

describe("ColorField", () => {
  it("muestra su selector solo cuando está abierto y avisa del estado", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const color = { r: 255, g: 0, b: 0, a: 1 };
    const { rerender } = render(
      <ColorField
        label="Color"
        color={color}
        isOpen={false}
        onToggle={onToggle}
        onChange={() => {}}
      />
    );
    const button = screen.getByRole("button", { name: "Color" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("slider")).toBeNull();

    await user.click(button);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(
      <ColorField
        label="Color"
        color={color}
        isOpen
        onToggle={onToggle}
        onChange={() => {}}
      />
    );
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0);
  });
});

describe("color", () => {
  it("convierte entre hex y RGB", () => {
    expect(rgbaToHex({ r: 255, g: 0, b: 128 })).toBe("#ff0080");
    expect(hexToRgb("#ff0080")).toEqual({ r: 255, g: 0, b: 128 });
    expect(hexToRgb("0f8")).toEqual({ r: 0, g: 255, b: 136 });
    expect(hexToRgb("#12")).toBeNull();
  });

  const red: Rgba = { r: 255, g: 0, b: 0, a: 0.5 };

  it("el campo hex y las muestras cambian el color (sin tocar la transparencia)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorPicker
        color={red}
        onChange={onChange}
        hasAlpha
        swatches={[{ r: 0, g: 0, b: 255, a: 1 }]}
      />
    );
    const hex = screen.getByLabelText("Hex");
    fireEvent.change(hex, { target: { value: "00ff00" } });
    expect(onChange).toHaveBeenLastCalledWith({ r: 0, g: 255, b: 0, a: 0.5 });

    await user.click(screen.getByRole("button", { name: "Color #0000ff" }));
    expect(onChange).toHaveBeenLastCalledWith({ r: 0, g: 0, b: 255, a: 1 });
  });

  it("sin transparencia, el color elegido siempre es opaco", () => {
    const onChange = vi.fn();
    render(<ColorPicker color={red} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Hex"), {
      target: { value: "00ff00" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("sin transparencia, no se reajusta con el color que él mismo eligió", () => {
    // Ese reajuste causaba el bucle "Maximum update depth exceeded" al
    // arrastrar. Se nota en el blanco: no tiene tono, así que el selector
    // perdía el que había elegido el usuario.
    const Harness = () => {
      const [color, setColor] = useState<Rgba>({ r: 0, g: 0, b: 255, a: 1 });
      return <ColorPicker color={color} onChange={setColor} />;
    };
    render(<Harness />);
    const area = screen.getByRole("slider", { name: "Color" });
    // react-colorful lee `keyCode` (user-event no lo rellena).
    for (let step = 0; step < 20; step++) {
      fireEvent.keyDown(area, { key: "ArrowLeft", keyCode: 37 });
    }

    expect(screen.getByLabelText("Hex")).toHaveValue("#ffffff");
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveAttribute(
      "aria-valuenow",
      "240"
    );
  });

  it("el botón de color es un botón real que abre el selector", async () => {
    const user = userEvent.setup();
    render(
      <ColorControl label="Color del pincel" color={red} onChange={vi.fn()} />
    );
    await user.tab();
    const button = screen.getByRole("button", { name: "Color del pincel" });
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Color del pincel" })
    ).toBeInTheDocument();
  });

  it("en escritorio se abre en un globo junto al botón", async () => {
    asDesktop();
    const user = userEvent.setup();
    render(
      <ColorControl
        label="Color del texto"
        color={red}
        onChange={vi.fn()}
        hasAlpha
      />
    );
    await user.click(screen.getByRole("button", { name: "Color del texto" }));
    expect(
      screen.getByRole("dialog", { name: "Color del texto" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Hex")).toBeInTheDocument();
  });

  it("deshabilitado no abre nada", async () => {
    const user = userEvent.setup();
    render(
      <ColorControl
        label="Color del texto"
        color={red}
        onChange={vi.fn()}
        disabled
      />
    );
    await user.click(screen.getByRole("button", { name: "Color del texto" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
