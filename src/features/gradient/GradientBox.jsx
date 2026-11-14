import { useEffect, useMemo, useRef, useState } from "react";
import { RgbaColorPicker } from "react-colorful";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import {
  GlobalButton,
  GlobalSpinner,
} from "../../components/ui/legacy/styledComponents";
import { rgbaToCss } from "../../editor/model/color";
import { useEditorStore } from "../../editor/store/editorStore";
import { cloneCanvas } from "../../lib/canvas";
import { reduceAspectRatioQualityOfIncomingImage } from "../../lib/helper";
import { bestFitGradient } from "./bestFitGradient";
import {
  ApplyGradientButton,
  GradientContainer,
  GradientPreviewContainer,
  WrapperColorPicker,
  WrapperGradientOptions,
} from "./GradientBox.styles";
import MultiInputRange from "./MultiInputRange";

const THUMB_BORDER = "2px solid black";
const ANGLE_THUMB_COLOR = { r: 255, g: 255, b: 224, a: 1 };

/** Editor de fondo degradado. Se rediseña en la Fase 5. */
const GradientBox = ({ onApplied }) => {
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const { stops, angle } = useEditorStore((state) => state.gradient);
  const addGradientStop = useEditorStore((state) => state.addGradientStop);
  const removeGradientStop = useEditorStore(
    (state) => state.removeGradientStop
  );
  const setGradientStopOffset = useEditorStore(
    (state) => state.setGradientStopOffset
  );
  const setGradientStopColor = useEditorStore(
    (state) => state.setGradientStopColor
  );
  const setGradientAngle = useEditorStore((state) => state.setGradientAngle);
  const setBackgroundImage = useEditorStore(
    (state) => state.setBackgroundImage
  );

  const refCanvasPreview = useRef(null);
  const [selectedStopId, setSelectedStopId] = useState(stops.at(-1).id);
  const [isApplyingGradient, setIsApplyingGradient] = useState(false);

  // Si la parada elegida ya no existe (se borró), se usa la última.
  const selectedStop =
    stops.find((stop) => stop.id === selectedStopId) ?? stops.at(-1);

  // Formato que espera MultiInputRange: { [id]: { id, thumbBackground, ... } }
  const stopThumbs = useMemo(
    () =>
      Object.fromEntries(
        stops.map((stop) => [
          stop.id,
          {
            id: stop.id,
            thumbBackground: stop.color,
            thumbBorder: THUMB_BORDER,
            thumbValue: stop.offset,
          },
        ])
      ),
    [stops]
  );
  const angleThumb = {
    degree: {
      id: "degree",
      thumbBackground: ANGLE_THUMB_COLOR,
      thumbBorder: THUMB_BORDER,
      thumbValue: angle,
    },
  };

  useEffect(
    function drawPreview() {
      const canvas = refCanvasPreview.current;
      const ctx = canvas.getContext("2d");
      const colorList = stops.map((stop) => ({
        opacity: stop.offset / 100,
        backgroundString: rgbaToCss(stop.color),
      }));
      ctx.fillStyle = bestFitGradient({
        angle: (angle * Math.PI) / 180,
        colorList,
        ctx,
        w: canvas.width,
        h: canvas.height,
      });
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    [stops, angle, canvasSize]
  );

  const { newWidth, newHeight } = reduceAspectRatioQualityOfIncomingImage({
    options: canvasSize,
    expectedMaxPixelsSize: 300,
  });

  const handleSelectThumb = (e) => {
    e.target.focus();
    setSelectedStopId(e.target.id);
  };

  const applyGradientBackground = () => {
    setIsApplyingGradient(true);
    // setTimeout: deja que se pinte el spinner antes del trabajo pesado.
    setTimeout(() => {
      // Copia del canvas de la vista previa: tiene el tamaño del documento y
      // sirve tanto para mostrar como para exportar. Antes se mostraba un JPEG
      // de calidad 0.1 (con bandas visibles).
      const gradient = cloneCanvas(refCanvasPreview.current);
      setBackgroundImage({
        source: gradient,
        preview: gradient,
        mimeType: "image/png",
      });
      setIsApplyingGradient(false);
      onApplied();
    }, 0);
  };

  return (
    <GradientContainer>
      <GradientPreviewContainer>
        <canvas
          ref={refCanvasPreview}
          style={{
            borderRadius: ".5rem",
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          }}
          width={canvasSize.width}
          height={canvasSize.height}
        >
          Not supported
        </canvas>

        <WrapperColorPicker>
          <RgbaColorPicker
            color={selectedStop.color}
            onChange={(color) => setGradientStopColor(selectedStop.id, color)}
          />
          <WrapperGradientOptions>
            <GlobalButton onClick={addGradientStop}>
              <AiOutlinePlus />
            </GlobalButton>
            <GlobalButton onClick={() => removeGradientStop(selectedStop.id)}>
              <AiOutlineMinus />
            </GlobalButton>
          </WrapperGradientOptions>
        </WrapperColorPicker>
      </GradientPreviewContainer>
      <div>
        <MultiInputRange
          style={{ margin: "2.5rem 0" }}
          onClickLine={addGradientStop}
          onMouseTouchStartThumb={handleSelectThumb}
          onChange={(e) =>
            setGradientStopOffset(e.target.id, Number(e.target.value))
          }
          inputPropListObj={stopThumbs}
          lineCursor="copy"
          thumbCursor="pointer"
          min="0"
          max="100"
        />

        <MultiInputRange
          style={{ margin: "2.5rem 0" }}
          onChange={(e) => setGradientAngle(Number(e.target.value))}
          thumbCursor="pointer"
          inputPropListObj={angleThumb}
          min="0"
          max="360"
        ></MultiInputRange>
      </div>
      <ApplyGradientButton type="button" onClick={applyGradientBackground}>
        <span>Aplicar fondo</span>
        {isApplyingGradient && (
          <GlobalSpinner width="20px" height="20px" border="2px solid #fff" />
        )}
      </ApplyGradientButton>
    </GradientContainer>
  );
};

export default GradientBox;
