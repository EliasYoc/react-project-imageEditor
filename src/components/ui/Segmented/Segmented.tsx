import { ToggleGroup } from "radix-ui";
import { classNames } from "../../../lib/classNames";
import type { IconComponent } from "../Button/IconButton";
import { Tooltip } from "../Tooltip";
import styles from "./Segmented.module.css";

export interface SegmentedItem<T extends string> {
  value: T;
  label: string;
  icon?: IconComponent;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  /** Nombre del grupo para el lector de pantalla (p. ej. "Alineación"). */
  label: string;
  /** La opción elegida (null = ninguna). */
  value: T | null;
  onChange: (value: T) => void;
  items: readonly SegmentedItem<T>[];
  /** Solo iconos: el texto queda como nombre accesible y tooltip. */
  isIconOnly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Opciones excluyentes (modo, alineación, forma…). Es un grupo de radio
 * accesible: Tab entra en la opción elegida, las flechas cambian de opción y
 * el lector anuncia "1 de 3, seleccionado". Antes eran botones sueltos con
 * `aria-pressed` que había que recorrer uno a uno con Tab.
 */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  items,
  isIconOnly = false,
  size = "md",
  className,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value ?? ""}
      // Volver a pulsar la opción elegida no la deselecciona (llegaría "").
      onValueChange={(next) => next && onChange(next as T)}
      className={classNames(styles.group, styles[size], className)}
    >
      {items.map(
        ({ value: itemValue, label: itemLabel, icon: Icon, disabled }) => {
          const item = (
            <ToggleGroup.Item
              key={itemValue}
              value={itemValue}
              disabled={disabled}
              aria-label={isIconOnly ? itemLabel : undefined}
              className={styles.item}
            >
              {Icon && <Icon aria-hidden="true" />}
              {!isIconOnly && <span>{itemLabel}</span>}
            </ToggleGroup.Item>
          );
          return isIconOnly ? (
            <Tooltip key={itemValue} label={itemLabel}>
              {item}
            </Tooltip>
          ) : (
            item
          );
        }
      )}
    </ToggleGroup.Root>
  );
}
