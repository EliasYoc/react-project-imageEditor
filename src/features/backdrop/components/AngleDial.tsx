import {
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./Backdrop.module.css";
import { normalizeAngle, pointerAngle } from "../utils/angle";

interface AngleDialProps {
  /** Grados, como en CSS: 0 = arriba, sentido horario. */
  value: number;
  onChange: (angle: number) => void;
  label?: string;
}

/**
 * Dial circular para el ángulo: se arrastra alrededor del centro (con Shift,
 * imán cada 15°) o con el teclado (flechas ±1°, Shift o RePág/AvPág ±15°,
 * Inicio = 0°).
 */
const AngleDial = ({ value, onChange, label = "Ángulo" }: AngleDialProps) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const angleFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return value;
    return pointerAngle(
      event.clientX - (rect.left + rect.width / 2),
      event.clientY - (rect.top + rect.height / 2),
      event.shiftKey
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    isDraggingRef.current = true;
    onChange(angleFromPointer(event));
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) onChange(angleFromPointer(event));
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const big = 15;
    const small = event.shiftKey ? big : 1;
    const steps: Record<string, number> = {
      ArrowRight: value + small,
      ArrowUp: value + small,
      ArrowLeft: value - small,
      ArrowDown: value - small,
      PageUp: value + big,
      PageDown: value - big,
      Home: 0,
    };
    if (!(event.key in steps)) return;
    event.preventDefault();
    onChange(normalizeAngle(steps[event.key]));
  };

  return (
    <div
      ref={dialRef}
      className={styles.dial}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={value}
      aria-valuetext={`${value}°`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span
        className={styles.dialHand}
        style={{ transform: `rotate(${value}deg)` }}
        aria-hidden="true"
      />
      <span className={styles.dialValue}>{value}°</span>
    </div>
  );
};

export default AngleDial;
