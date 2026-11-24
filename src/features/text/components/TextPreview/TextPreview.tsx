import { useRef } from "react";
import { readableBackdrop } from "../../../../editor/elements/readableBackdrop";
import { rgbaToCss } from "../../../../editor/model/color";
import type { TextElement } from "../../../../editor/model/types";
import { PREVIEW_HEIGHT } from "../../constants/textPreview";
import { useTextPreview } from "../../hooks/useTextPreview";
import styles from "./TextPreview.module.css";

/**
 * Vista previa del texto seleccionado, fija arriba del panel «Fuente y
 * estilo» mientras se hace scroll. Es un lienzo pequeño de Konva con la misma
 * configuración que el lienzo y la exportación (`createTextLabel`), así que
 * el contorno, la sombra, el degradado y la caja se ven igual. No representa
 * el lienzo del documento: el fondo es blanco, o gris oscuro si el texto es
 * claro.
 */
const TextPreview = ({ text }: { text: TextElement }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  useTextPreview(hostRef, text);

  return (
    <div className={styles.bar}>
      <div
        className={styles.preview}
        role="img"
        aria-label="Vista previa del texto"
        style={{ backgroundColor: rgbaToCss(readableBackdrop(text)) }}
      >
        {/* Con su alto desde el principio: el panel no salta al crearse Konva. */}
        <div
          ref={hostRef}
          className={styles.canvas}
          style={{ height: PREVIEW_HEIGHT }}
        />
      </div>
    </div>
  );
};

export default TextPreview;
