import { AlertDialog, Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { Button, type IconComponent } from "../Button";
import { useReturnFocus } from "../useReturnFocus";
import styles from "./Dialog.module.css";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * Delante del título: el icono del botón o la opción de menú que lo abre
   * (solo a la vista; el nombre del diálogo es el título).
   */
  icon?: IconComponent;
  description?: string;
  children: ReactNode;
}

/**
 * Diálogo modal centrado (p. ej. exportar): foco atrapado, Escape y tocar
 * fuera lo cierran, y el foco vuelve al botón que lo abrió.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  icon: Icon,
  description,
  children,
}: DialogProps) {
  const returnFocus = useReturnFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content
          className={styles.content}
          {...(!description && { "aria-describedby": undefined })}
          {...returnFocus}
        >
          <RadixDialog.Title className={styles.title}>
            {Icon && <Icon aria-hidden="true" />}
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className={styles.description}>
              {description}
            </RadixDialog.Description>
          )}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Botones al pie de un diálogo, alineados a la derecha. */
export const DialogActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
);

/** Cierra el diálogo que lo contiene (envuelve un botón). */
export const DialogClose = RadixDialog.Close;

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** La acción destruye algo (botón rojo). */
  isDestructive?: boolean;
}

/**
 * Confirmación antes de algo que el usuario podría lamentar. Es un
 * `alertdialog`: el foco empieza en "Cancelar" y tocar fuera no confirma.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  isDestructive = false,
}: ConfirmDialogProps) {
  const returnFocus = useReturnFocus();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.content} {...returnFocus}>
          <AlertDialog.Title className={styles.title}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.description}>
            {description}
          </AlertDialog.Description>
          <div className={styles.actions}>
            <AlertDialog.Cancel asChild>
              <Button size="sm">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                size="sm"
                variant={isDestructive ? "danger" : "primary"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
