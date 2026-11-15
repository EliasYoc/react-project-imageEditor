import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { IconButton } from "../Button";
import { useReturnFocus } from "../useReturnFocus";
import styles from "./Panel.module.css";

/** Arrastrar la hoja hacia abajo más de esto (en px) la cierra. */
const CLOSE_DISTANCE = 80;

export interface PanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Panel de ajustes (pinceles, color, fondo, estilo del texto…):
 *
 * - **Móvil:** hoja inferior modal. El lienzo se oscurece un poco, el foco
 *   queda dentro y se cierra con ✕, Escape, tocando fuera o arrastrando la
 *   cabecera hacia abajo.
 * - **Escritorio:** panel lateral NO modal: el lienzo sigue a la vista y se
 *   puede seguir dibujando o elegir otro texto con el panel abierto. Se
 *   cierra con ✕ o Escape (tocar fuera no lo cierra: sería al dibujar).
 *
 * Es un diálogo de Radix: tiene título accesible y devuelve el foco al botón
 * que lo abrió. Las animaciones son de entrada y salida (CSS), y si no hay
 * animación (p. ej. "reducir movimiento") se cierra igual: antes la hoja
 * dependía de `transitionend` y se podía quedar abierta.
 */
export function Panel({
  open,
  onOpenChange,
  title,
  description,
  children,
}: PanelProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const returnFocus = useReturnFocus();
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; pointerId: number } | null>(null);

  const setDragOffset = (offset: number) => {
    const content = contentRef.current;
    if (content) content.style.translate = offset ? `0 ${offset}px` : "";
  };

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (isDesktop || event.button !== 0) return;
    // Desde el asa o el título; los botones de la cabecera hacen lo suyo.
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = { startY: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setDragOffset(Math.max(0, event.clientY - drag.startY));
  };

  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.clientY - drag.startY > CLOSE_DISTANCE) onOpenChange(false);
    else setDragOffset(0);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={!isDesktop}>
      <Dialog.Portal>
        {!isDesktop && <Dialog.Overlay className={styles.overlay} />}
        <Dialog.Content
          ref={contentRef}
          className={isDesktop ? styles.side : styles.sheet}
          // Sin descripción no se enlaza ninguna (Radix avisaría).
          {...(!description && { "aria-describedby": undefined })}
          {...returnFocus}
          onInteractOutside={
            isDesktop ? (event) => event.preventDefault() : undefined
          }
        >
          <div
            className={styles.header}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={() => {
              dragRef.current = null;
              setDragOffset(0);
            }}
          >
            {!isDesktop && (
              <span className={styles.handle} aria-hidden="true" />
            )}
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton icon={X} aria-label="Cerrar" shortcut="Esc" />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className={styles.description}>
              {description}
            </Dialog.Description>
          )}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
