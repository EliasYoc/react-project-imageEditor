import { Check } from "lucide-react";
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

export interface ChoiceMenuOption<T extends string> {
  value: T;
  label: string;
  icon?: IconComponent;
}

export interface ChoiceMenuProps<T extends string> {
  /** El botón que abre el menú (acepta ref y props, p. ej. un IconButton). */
  trigger: ReactElement;
  /** Nombre del grupo para el lector de pantalla (p. ej. "Forma"). */
  label: string;
  /** La opción elegida. */
  value: T;
  onChange: (value: T) => void;
  options: readonly ChoiceMenuOption<T>[];
  align?: "start" | "center" | "end";
}

/**
 * Menú para elegir UNA opción entre varias (p. ej. la figura del pincel de
 * formas): la elegida lleva una marca. Mismo aspecto y mismo manejo que
 * `Menu`; para el lector de pantalla es un grupo de radio.
 */
export function ChoiceMenu<T extends string>({
  trigger,
  label,
  value,
  onChange,
  options,
  align = "end",
}: ChoiceMenuProps<T>) {
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
          <DropdownMenu.RadioGroup
            aria-label={label}
            value={value}
            onValueChange={(next) => onChange(next as T)}
          >
            {options.map(
              ({ value: option, label: optionLabel, icon: Icon }) => (
                <DropdownMenu.RadioItem
                  key={option}
                  value={option}
                  className={styles.item}
                >
                  {/* Hueco fijo: los nombres quedan alineados con o sin marca. */}
                  <span className={styles.check}>
                    <DropdownMenu.ItemIndicator>
                      <Check aria-hidden="true" />
                    </DropdownMenu.ItemIndicator>
                  </span>
                  {Icon && <Icon aria-hidden="true" />}
                  {optionLabel}
                </DropdownMenu.RadioItem>
              )
            )}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
