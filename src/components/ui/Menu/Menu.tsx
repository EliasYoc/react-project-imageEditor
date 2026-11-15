import { DropdownMenu } from "radix-ui";
import type { ReactElement } from "react";
import type { IconComponent } from "../Button/IconButton";
import styles from "./Menu.module.css";

export interface MenuItem {
  label: string;
  icon?: IconComponent;
  onSelect: () => void;
  /** Acción destructiva (en rojo). */
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  /** El botón que abre el menú (acepta ref y props, p. ej. un IconButton). */
  trigger: ReactElement;
  items: readonly MenuItem[];
  align?: "start" | "center" | "end";
}

/**
 * Menú desplegable accesible: se abre con clic, Enter o flecha abajo; las
 * flechas recorren las opciones, se puede escribir la inicial de una opción y
 * Escape lo cierra devolviendo el foco al botón.
 *
 * No modal: así una opción puede abrir un diálogo sin que los dos se peleen
 * por el foco y los clics de la página.
 */
export function Menu({ trigger, items, align = "end" }: MenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.content}
          align={align}
          sideOffset={6}
          collisionPadding={8}
        >
          {items.map(({ label, icon: Icon, onSelect, danger, disabled }) => (
            <DropdownMenu.Item
              key={label}
              className={styles.item}
              data-danger={danger || undefined}
              disabled={disabled}
              onSelect={onSelect}
            >
              {Icon && <Icon aria-hidden="true" />}
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
