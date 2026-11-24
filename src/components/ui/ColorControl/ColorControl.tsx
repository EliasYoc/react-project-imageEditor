import { Popover } from "radix-ui";
import { useState, type ComponentProps, type ReactElement } from "react";
import { HexColorInput, RgbColorPicker, RgbaColorPicker } from "react-colorful";
import { hexToRgb, rgbaToCss, rgbaToHex } from "../../../editor/model/color";
import type { Rgba } from "../../../editor/model/types";
import { classNames } from "../../../lib/classNames";
import { DESKTOP_QUERY, useMediaQuery } from "../../../hooks/useMediaQuery";
import { Panel } from "../Panel";
import { Tooltip } from "../Tooltip";
import { ToolbarButton } from "../Toolbar";
import styles from "./ColorControl.module.css";

export interface ColorPickerProps {
  color: Rgba;
  onChange: (color: Rgba) => void;
  /** Con control de transparencia (si no, el color siempre es opaco). */
  hasAlpha?: boolean;
  /** Muestras rápidas debajo del selector. */
  swatches?: readonly Rgba[];
}

/** Selector de color: área de tono, código hex y muestras rápidas. */
export function ColorPicker({
  color,
  onChange,
  hasAlpha = false,
  swatches = [],
}: ColorPickerProps) {
  // RgbColorPicker compara, campo a campo, el color que recibe con el último
  // que emitió, que no lleva `a`. Si lo recibe con `a`, lo toma por un color
  // nuevo y se reajusta. Al arrastrar con la página ocupada, eso rebotaba
  // entre dos colores hasta que React cortaba con "Maximum update depth
  // exceeded".
  const rgb = { r: color.r, g: color.g, b: color.b };

  return (
    <div className={styles.picker}>
      {hasAlpha ? (
        <RgbaColorPicker color={color} onChange={onChange} />
      ) : (
        <RgbColorPicker
          color={rgb}
          onChange={(nextRgb) => onChange({ ...nextRgb, a: 1 })}
        />
      )}
      <label className={styles.hexField}>
        <span>Hex</span>
        <HexColorInput
          className={styles.hex}
          color={rgbaToHex(color)}
          prefixed
          onChange={(hex) => {
            const rgb = hexToRgb(hex);
            if (rgb) onChange({ ...rgb, a: hasAlpha ? color.a : 1 });
          }}
        />
      </label>
      {swatches.length > 0 && (
        <div
          className={styles.swatches}
          role="group"
          aria-label="Colores rápidos"
        >
          {swatches.map((swatch) => (
            <button
              key={rgbaToCss(swatch)}
              type="button"
              className={styles.swatch}
              style={{ background: rgbaToCss(swatch) }}
              aria-label={`Color ${rgbaToHex(swatch)}`}
              onClick={() =>
                onChange({ ...swatch, a: hasAlpha ? swatch.a : 1 })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface ColorButtonProps extends Omit<
  ComponentProps<"button">,
  "color"
> {
  label: string;
  /** null: no hay nada a lo que darle color (el botón se ve vacío). */
  color: Rgba | null;
}

/**
 * Muestra del color actual como botón redondo. Es un <button> real (antes un
 * <div>: no se podía usar con teclado). La transparencia se ve sobre cuadros.
 */
export function ColorButton({
  label,
  color,
  className,
  ...props
}: ColorButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        className={classNames(styles.button, className)}
        {...props}
      >
        <span
          className={styles.buttonSwatch}
          style={{ background: color ? rgbaToCss(color) : "transparent" }}
        />
      </button>
    </Tooltip>
  );
}

export interface ColorControlProps extends ColorPickerProps {
  /** Nombre del botón y título del selector, p. ej. "Color del pincel". */
  label: string;
  disabled?: boolean;
  /** El botón entra en el recorrido con flechas de la `Toolbar` que lo contiene. */
  isToolbarItem?: boolean;
}

/**
 * Botón de color que abre su selector: en escritorio, un globo junto al
 * botón; en el móvil, una hoja inferior (más espacio para el dedo).
 */
export function ColorControl({
  label,
  disabled = false,
  isToolbarItem = false,
  ...pickerProps
}: ColorControlProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [isOpen, setIsOpen] = useState(false);
  const open = isOpen && !disabled;
  const picker = <ColorPicker {...pickerProps} />;
  const asToolbarItem = (button: ReactElement) =>
    isToolbarItem ? <ToolbarButton>{button}</ToolbarButton> : button;

  if (isDesktop) {
    return (
      <Popover.Root open={open} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          {asToolbarItem(
            <ColorButton
              label={label}
              color={disabled ? null : pickerProps.color}
              disabled={disabled}
            />
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={styles.popover}
            side="top"
            sideOffset={10}
            collisionPadding={12}
            aria-label={label}
          >
            {picker}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <>
      {asToolbarItem(
        <ColorButton
          label={label}
          color={disabled ? null : pickerProps.color}
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={() => setIsOpen(true)}
        />
      )}
      <Panel open={open} onOpenChange={setIsOpen} title={label}>
        {picker}
      </Panel>
    </>
  );
}
