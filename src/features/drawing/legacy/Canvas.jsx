import { useEffect } from "react";
import { useEditorCanvas } from "../../../editor/canvas/editorCanvasContext";
import { redrawGlobalDrawingLogs } from "../../../editor/legacy/canvasUtils";
import { editorStore, useEditorStore } from "../../../editor/store/editorStore";

/**
 * Canvas principal: aquí quedan los trazos terminados. La imagen de fondo se
 * muestra con CSS (background-image) debajo del canvas transparente.
 * Se reemplaza por el Stage de Konva en la Fase 2.
 */
const Canvas = () => {
  const { mainCanvasRef } = useEditorCanvas();
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const previewUrl = useEditorStore((state) => state.background.previewUrl);

  useEffect(
    function repaintWhenSizeOrBackgroundChanges() {
      const canvas = mainCanvasRef.current;
      // Se lee el historial con getState() para no repintar en cada trazo:
      // los trazos nuevos ya se dibujan directamente mientras se pinta.
      // Al cambiar el fondo (p. ej. un gradiente) los trazos se vuelven a pintar
      // encima; antes desaparecían de la vista aunque seguían en el historial.
      redrawGlobalDrawingLogs(
        Boolean(previewUrl),
        canvas,
        canvas.getContext("2d"),
        editorStore.getState().log
      );
    },
    [mainCanvasRef, canvasSize, previewUrl]
  );

  return (
    <canvas
      ref={mainCanvasRef}
      className="principal-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        backgroundImage: previewUrl ? `url(${previewUrl})` : "none",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
        objectFit: "contain",
      }}
      width={canvasSize.width}
      height={canvasSize.height}
    >
      canvas editor
    </canvas>
  );
};

export default Canvas;
