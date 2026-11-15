import {
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gradientToCss } from "../../editor/engine/fill/css";
import type { Gradient, Point, Size } from "../../editor/model/types";
import styles from "./Backdrop.module.css";

interface GradientPreviewProps {
  gradient: Gradient;
  /** Tamaño del documento (la vista previa tiene sus proporciones). */
  documentSize: Size;
  onCenterChange: (center: Point) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Vista previa del degradado con las proporciones del documento (CSS con la
 * misma geometría que el lienzo). En radial y cónico, arrastrar sobre ella
 * mueve el centro; con teclado, las flechas (Shift = pasos de 10 %).
 */
const GradientPreview = ({
  gradient,
  documentSize,
  onCenterChange,
}: GradientPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasCenter = gradient.type !== "linear";
  const { center } = gradient;

  const centerFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return center;
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasCenter) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    isDraggingRef.current = true;
    onCenterChange(centerFromPointer(event));
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) onCenterChange(centerFromPointer(event));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasCenter) return;
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: center.x - step, y: center.y },
      ArrowRight: { x: center.x + step, y: center.y },
      ArrowUp: { x: center.x, y: center.y - step },
      ArrowDown: { x: center.x, y: center.y + step },
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    onCenterChange({ x: clamp01(next.x), y: clamp01(next.y) });
  };

  return (
    <div
      ref={previewRef}
      className={styles.preview}
      style={{
        aspectRatio: `${documentSize.width} / ${documentSize.height}`,
        backgroundImage: gradientToCss(gradient),
      }}
      tabIndex={hasCenter ? 0 : -1}
      aria-label={
        hasCenter
          ? "Centro del degradado (arrastra o usa las flechas)"
          : "Vista previa del degradado"
      }
      data-movable={hasCenter || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (isDraggingRef.current = false)}
      onPointerCancel={() => (isDraggingRef.current = false)}
      onKeyDown={onKeyDown}
    >
      {hasCenter && (
        <span
          className={styles.centerMarker}
          style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default GradientPreview;
