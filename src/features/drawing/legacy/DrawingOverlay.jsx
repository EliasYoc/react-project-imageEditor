import { useEffect, useRef, useState } from "react";
import PixelRange from "../../../components/ui/PixelRange/PixelRange";
import PortalNormalModal from "../../../components/layout/PortalNormalModal";
import { useEditorCanvas } from "../../../editor/canvas/editorCanvasContext";
import {
  deleteCanvasWithTransparency,
  drawCanvasCoordsCallback,
  paintWholeCanvas,
  redrawLastPath,
  redrawSprayPoints,
} from "../../../editor/legacy/canvasUtils";
import { rgbaToCss } from "../../../editor/model/color";
import {
  BRUSH_SIZE_RANGE,
  TEXT_SIZE_RANGE,
} from "../../../editor/model/factories";
import { editorStore, useEditorStore } from "../../../editor/store/editorStore";
import {
  selectCurrentBrush,
  selectElements,
  selectSelectedText,
} from "../../../editor/store/selectors";
import ElementEditable from "../../text/legacy/ElementEditable";

/** Proporción del radio interior del spray respecto al exterior. */
const SPRAY_INNER_RADIUS_RATIO = 1 - 89 / 100;

/**
 * Capa transparente sobre el canvas principal: recibe el puntero mientras se
 * dibuja, muestra la vista previa del trazo y contiene los elementos (texto,
 * imágenes). Se reemplaza por Konva en la Fase 2.
 */
const DrawingOverlay = () => {
  const { mainCanvasRef, overlayCanvasRef } = useEditorCanvas();
  const mode = useEditorStore((state) => state.mode);
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const previewUrl = useEditorStore((state) => state.background.previewUrl);
  const elements = useEditorStore(selectElements);
  const brushSize = useEditorStore((state) => selectCurrentBrush(state).size);
  const selectedText = useEditorStore(selectSelectedText);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const updateElement = useEditorStore((state) => state.updateElement);
  const addLogEntry = useEditorStore((state) => state.addLogEntry);

  const isDrawing = mode === "draw";
  const isEditingText = mode === "text";
  const [checkInput, setCheckInput] = useState(false);

  // Estado del trazo en curso. Son refs (no estado ni variables locales):
  // no deben provocar renders y tienen que sobrevivir si hay uno a mitad del trazo.
  const refContainer = useRef(null);
  const refStroke = useRef(null);
  const refPaintingLogs = useRef([]);
  const refIsPainting = useRef(false);
  const refWholeCanvasHasBeenPainted = useRef(false);
  const refPressHoldTimeout = useRef(null);
  const refPointCounter = useRef(0);
  const refAllowOneDotAfterPaintingWholeCanvas = useRef(false);

  useEffect(
    function clearOverlayWhenCanvasChanges() {
      const canvas = overlayCanvasRef.current;
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    },
    [overlayCanvasRef, canvasSize, previewUrl]
  );

  const getCanvases = () => ({
    $canvas: mainCanvasRef.current,
    ctx: mainCanvasRef.current.getContext("2d"),
    frontalCanvasCtx: overlayCanvasRef.current.getContext("2d"),
  });

  const listenerStartPainting = () => {
    // El pincel se lee al empezar el trazo y se guarda en un ref: los handlers
    // no necesitan que el componente se vuelva a renderizar al cambiar de color.
    const { brush, background } = editorStore.getState();
    const { color, size } = brush.settings[brush.type];
    const { ctx, frontalCanvasCtx } = getCanvases();
    const startCircleRadius = size / 2;

    refStroke.current = {
      pencilType: brush.type,
      color,
      size,
      cssColor: rgbaToCss(color),
      startCircleRadius,
      endCircleRadius: startCircleRadius * SPRAY_INNER_RADIUS_RATIO,
    };

    // Antes esta configuración vivía en un useEffect que dependía de renders
    // posteriores (p. ej. tras deshacer) para restablecer el modo de fusión.
    ctx.lineCap = frontalCanvasCtx.lineCap = "round";
    ctx.lineJoin = frontalCanvasCtx.lineJoin = "round";
    ctx.globalCompositeOperation = frontalCanvasCtx.globalCompositeOperation =
      brush.type === "eraser" && background.image
        ? "destination-out"
        : "source-over";
    ctx.lineWidth = frontalCanvasCtx.lineWidth = size || 50;
    ctx.strokeStyle = frontalCanvasCtx.strokeStyle = refStroke.current.cssColor;
    frontalCanvasCtx.beginPath();
    ctx.beginPath();

    refPressHoldTimeout.current = setTimeout(() => {
      paintWholeCanvas(
        ctx,
        refStroke.current.cssColor,
        canvasSize.width,
        canvasSize.height
      );
      addLogEntry({
        whatTask: "paintingWholeCanvas",
        canvasColor: color,
        globalCompositeOperation: frontalCanvasCtx.globalCompositeOperation,
      });
      refWholeCanvasHasBeenPainted.current = true;
      refPaintingLogs.current = [];
      refAllowOneDotAfterPaintingWholeCanvas.current = false;
    }, 500);

    refIsPainting.current = true;
    refAllowOneDotAfterPaintingWholeCanvas.current = true;
  };

  const listenerPainting = (e) => {
    if (refIsPainting.current) {
      refPointCounter.current += 1;
      if (refPressHoldTimeout.current && refPointCounter.current > 8) {
        // En el móvil: evita rellenar todo el lienzo si el dedo ya se movió.
        clearTimeout(refPressHoldTimeout.current);
        refPressHoldTimeout.current = null;
      }
      const { pencilType, color, size, startCircleRadius, endCircleRadius } =
        refStroke.current;
      const { $canvas, ctx, frontalCanvasCtx } = getCanvases();

      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        refPaintingLogs.current.push({ coordX, coordY });
        if (pencilType === "eraser") {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          return;
        }
        if (pencilType === "spray") {
          redrawSprayPoints(
            ctx,
            coordX,
            coordY,
            startCircleRadius,
            endCircleRadius,
            size,
            color.r,
            color.g,
            color.b,
            color.a
          );
          return;
        }
        if (!refAllowOneDotAfterPaintingWholeCanvas.current) {
          deleteCanvasWithTransparency({
            canvasCtx: frontalCanvasCtx,
            canvasHeight: canvasSize.height,
            canvasWidth: canvasSize.width,
          });
          redrawLastPath(frontalCanvasCtx, refPaintingLogs.current);
        }
      });
    }
    if (refAllowOneDotAfterPaintingWholeCanvas.current)
      refAllowOneDotAfterPaintingWholeCanvas.current = false;
  };

  const listenerStopPainting = (e) => {
    // Soltar el botón sin haber empezado un trazo aquí (p. ej. se presionó
    // fuera del lienzo) no debe dibujar nada.
    if (!refIsPainting.current) return;
    clearTimeout(refPressHoldTimeout.current);
    const { pencilType, color, size, startCircleRadius, endCircleRadius } =
      refStroke.current;
    const { $canvas, ctx, frontalCanvasCtx } = getCanvases();

    if (!refWholeCanvasHasBeenPainted.current) {
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        if (pencilType === "spray") {
          redrawSprayPoints(
            ctx,
            coordX,
            coordY,
            startCircleRadius,
            endCircleRadius,
            size,
            color.r,
            color.g,
            color.b,
            color.a
          );
          refPaintingLogs.current.push({ coordX, coordY });
        }
        if (
          pencilType === "normal" &&
          refAllowOneDotAfterPaintingWholeCanvas.current
        ) {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          refPaintingLogs.current.push({ coordX, coordY });
        }
        if (pencilType === "eraser") {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          refPaintingLogs.current.push({ coordX, coordY });
        }
      });
    }

    if (refPaintingLogs.current.length) {
      const defaultLogProperties = {
        data: refPaintingLogs.current,
        color,
        size,
        globalCompositeOperation: frontalCanvasCtx.globalCompositeOperation,
      };
      if (pencilType === "spray") {
        addLogEntry({
          ...defaultLogProperties,
          whatTask: "sprayPainting",
          startCircleRadius,
          endCircleRadius,
        });
      } else {
        addLogEntry({ ...defaultLogProperties, whatTask: "painting" });
        deleteCanvasWithTransparency({
          canvasCtx: frontalCanvasCtx,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        });
        redrawLastPath(ctx, refPaintingLogs.current);
      }
    }

    refPointCounter.current = 0;
    refIsPainting.current = false;
    refPaintingLogs.current = [];
    refWholeCanvasHasBeenPainted.current = false;
    refAllowOneDotAfterPaintingWholeCanvas.current = false;
  };

  const paintingHandlers = isDrawing
    ? {
        onMouseDown: listenerStartPainting,
        onTouchStart: listenerStartPainting,
        onMouseMove: listenerPainting,
        onTouchMove: listenerPainting,
        onMouseUp: listenerStopPainting,
        onTouchEnd: listenerStopPainting,
      }
    : {};

  return (
    <div
      ref={refContainer}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <PortalNormalModal
        isOpen={checkInput}
        onClose={() => setCheckInput(false)}
      />
      {elements.map((element) => (
        <ElementEditable
          key={element.id}
          element={element}
          containerRef={refContainer}
          setCheckInput={setCheckInput}
        />
      ))}

      <canvas
        {...paintingHandlers}
        width={canvasSize.width}
        height={canvasSize.height}
        ref={overlayCanvasRef}
        style={{
          position: "absolute",
          zIndex: isDrawing ? "100" : "1",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "crisp-edges",
        }}
      >
        Este navegador no es compatible
      </canvas>
      {isDrawing && (
        <PixelRange
          value={brushSize}
          min={BRUSH_SIZE_RANGE.min}
          max={BRUSH_SIZE_RANGE.max}
          onChange={setBrushSize}
        />
      )}
      {isEditingText && selectedText && (
        <PixelRange
          value={selectedText.fontSize}
          min={TEXT_SIZE_RANGE.min}
          max={TEXT_SIZE_RANGE.max}
          onChange={(fontSize) => updateElement(selectedText.id, { fontSize })}
        />
      )}
    </div>
  );
};

export default DrawingOverlay;
