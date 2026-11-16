import {
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { stopsToCss } from "../../../editor/engine/fill/css";
import {
  MIN_STOPS,
  addStop,
  moveStop,
  removeStop,
} from "../../../editor/engine/fill/stops";
import { rgbaToCss } from "../../../editor/model/color";
import type { Gradient } from "../../../editor/model/types";
import { createId } from "../../../lib/createId";
import styles from "./Backdrop.module.css";

interface GradientStopsBarProps {
  gradient: Gradient;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** `mergeKey`: arrastrar una parada es un solo paso del historial. */
  onChange: (gradient: Gradient, mergeKey?: string) => void;
}

/**
 * Barra con el degradado y sus paradas:
 * - arrastrar una parada la mueve; tocar la barra añade una (con el color que
 *   ya había en ese punto);
 * - con teclado, cada parada es un slider: flechas (±1 %, Shift ±10 %),
 *   Inicio/Fin, y Supr para quitarla.
 */
const GradientStopsBar = ({
  gradient,
  selectedId,
  onSelect,
  onChange,
}: GradientStopsBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<string | null>(null);

  const offsetAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onBarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Solo la barra: las paradas tienen su propio manejador.
    if (event.target !== event.currentTarget) return;
    const id = createId();
    const next = addStop(gradient, offsetAt(event.clientX), id);
    if (next === gradient) return; // ya hay el máximo de paradas
    onChange(next);
    onSelect(id);
  };

  const onStopPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    draggingRef.current = id;
    onSelect(id);
  };

  const onStopPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const id = draggingRef.current;
    if (!id) return;
    onChange(moveStop(gradient, id, offsetAt(event.clientX)), `stop:${id}`);
  };

  const onStopPointerUp = () => {
    draggingRef.current = null;
  };

  const onStopKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const stop = gradient.stops.find((candidate) => candidate.id === id);
    if (!stop) return;
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, number> = {
      ArrowRight: stop.offset + step,
      ArrowUp: stop.offset + step,
      ArrowLeft: stop.offset - step,
      ArrowDown: stop.offset - step,
      Home: 0,
      End: 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      onChange(moveStop(gradient, id, moves[event.key]), `stop:${id}`);
    } else if (
      (event.key === "Delete" || event.key === "Backspace") &&
      gradient.stops.length > MIN_STOPS
    ) {
      event.preventDefault();
      onChange(removeStop(gradient, id));
    }
  };

  return (
    <div
      ref={barRef}
      className={styles.stopsBar}
      style={{ backgroundImage: stopsToCss(gradient.stops) }}
      onPointerDown={onBarPointerDown}
      title="Toca la barra para añadir una parada"
    >
      {gradient.stops.map((stop, index) => (
        <div
          key={stop.id}
          role="slider"
          tabIndex={0}
          aria-label={`Parada ${index + 1}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(stop.offset * 100)}
          aria-valuetext={`${Math.round(stop.offset * 100)} %`}
          data-selected={stop.id === selectedId || undefined}
          className={styles.stop}
          style={{
            left: `${stop.offset * 100}%`,
            backgroundColor: rgbaToCss(stop.color),
          }}
          onPointerDown={(event) => onStopPointerDown(event, stop.id)}
          onPointerMove={onStopPointerMove}
          onPointerUp={onStopPointerUp}
          onPointerCancel={onStopPointerUp}
          onFocus={() => onSelect(stop.id)}
          onKeyDown={(event) => onStopKeyDown(event, stop.id)}
        />
      ))}
    </div>
  );
};

export default GradientStopsBar;
