import { Popover } from "radix-ui";
import { useState, type ComponentProps } from "react";
import { HexColorInput, RgbColorPicker, RgbaColorPicker } from "react-colorful";
import { hexToRgb, rgbaToCss, rgbaToHex } from "../../../editor/model/color";
import type { Rgba } from "../../../editor/model/types";
import { classNames } from "../../../lib/classNames";
import { DESKTOP_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { Panel } from "../Panel";
import { Tooltip } from "../Tooltip";
import styles from "./ColorControl.module.css";

export interface ColorPickerProps {
  color: Rgba;
  onChange: (color: Rgba) => void;
  /** Con control de transparencia (si no, el color siempre es opaco). */
  alpha?: boolean;
  /** Muestras rápidas debajo del selector. */
  swatches?: readonly Rgba[];
}

/** Selector de color: área de tono, código hex y muestras rápidas. */
export function ColorPicker({
  color,
  onChange,
  alpha = false,
  swatches = [],
}: ColorPickerProps) {
  return (
    <div className={styles.picker}>
      {alpha ? (
        <RgbaColorPicker color={color} onChange={onChange} />
      ) : (
        <RgbColorPicker
          color={color}
          onChange={(rgb) => onChange({ ...rgb, a: 1 })}
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
            if (rgb) onChange({ ...rgb, a: alpha ? color.a : 1 });
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
              onClick={() => onChange({ ...swatch, a: alpha ? swatch.a : 1 })}
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
}

/**
 * Botón de color que abre su selector: en escritorio, un globo junto al
 * botón; en el móvil, una hoja inferior (más espacio para el dedo).
 */
export function ColorControl({
  label,
  disabled = false,
  ...pickerProps
}: ColorControlProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [isOpen, setIsOpen] = useState(false);
  const open = isOpen && !disabled;
  const picker = <ColorPicker {...pickerProps} />;

  if (isDesktop) {
    return (
      <Popover.Root open={open} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <ColorButton
            label={label}
            color={disabled ? null : pickerProps.color}
            disabled={disabled}
          />
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
      <ColorButton
        label={label}
        color={disabled ? null : pickerProps.color}
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      />
      <Panel open={open} onOpenChange={setIsOpen} title={label}>
        {picker}
      </Panel>
    </>
  );
}
