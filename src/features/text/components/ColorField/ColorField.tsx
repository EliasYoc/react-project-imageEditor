import { ColorPicker } from "../../../../components/ui/ColorControl";
import { rgbaToCss } from "../../../../editor/model/color";
import type { Rgba } from "../../../../editor/model/types";
import styles from "./ColorField.module.css";

interface ColorFieldProps {
  label: string;
  color: Rgba;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (color: Rgba) => void;
}

/**
 * Muestra de color que despliega su selector debajo (dentro de un panel, sin
 * abrir otro encima).
 */
const ColorField = ({
  label,
  color,
  isOpen,
  onToggle,
  onChange,
}: ColorFieldProps) => (
  <div className={styles.colorField}>
    <button
      type="button"
      className={styles.colorButton}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <span
        className={styles.swatch}
        style={{ background: rgbaToCss(color) }}
        aria-hidden="true"
      />
      {label}
    </button>
    {isOpen && <ColorPicker color={color} onChange={onChange} hasAlpha />}
  </div>
);

export default ColorField;
