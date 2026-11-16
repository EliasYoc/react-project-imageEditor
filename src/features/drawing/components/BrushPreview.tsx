import { useEffect, useRef } from "react";
import { usesStampShape } from "../../../editor/engine/brushes/presets";
import type { BrushPresetId } from "../../../editor/model/types";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectBrushColor } from "../../../editor/store/selectors";
import { PREVIEW_SIZE, drawBrushPreview } from "../utils/previewStroke";
import styles from "./BrushLibrary.module.css";

/**
 * Trazo de muestra de un preset, pintado con el mismo motor que el lienzo y
 * con sus ajustes y el color actuales: lo que se ve es lo que se dibuja.
 */
const BrushPreview = ({ presetId }: { presetId: BrushPresetId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useEditorStore((state) => state.brush.settings[presetId]);
  const color = useEditorStore(selectBrushColor);
  // Solo la vista previa del pincel de formas depende de la figura elegida.
  const shape = useEditorStore((state) =>
    usesStampShape(presetId) ? state.brush.shape : undefined
  );

  useEffect(
    function paintPreview() {
      const canvas = canvasRef.current;
      // jsdom (tests) no tiene canvas 2D: no hay nada que pintar.
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      // Resolución de la pantalla: nítido en pantallas de alta densidad.
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(PREVIEW_SIZE.width * ratio);
      canvas.height = Math.round(PREVIEW_SIZE.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawBrushPreview(ctx, presetId, settings, color, shape);
    },
    [presetId, settings, color, shape]
  );

  return (
    <canvas
      ref={canvasRef}
      className={styles.preview}
      style={{ width: PREVIEW_SIZE.width, height: PREVIEW_SIZE.height }}
      aria-hidden="true"
    />
  );
};

export default BrushPreview;
