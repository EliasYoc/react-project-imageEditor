import { useEffect, useMemo, useRef } from "react";
import Moveable from "react-moveable";
import { useEditorCanvas } from "../../../editor/canvas/editorCanvasContext";
import {
  getElementGeometry,
  measureElement,
} from "../../../editor/legacy/draggableElements";
import { rgbaToCss } from "../../../editor/model/color";
import { useEditorStore } from "../../../editor/store/editorStore";
import { debounce } from "../../../lib/helper";
import {
  DraggableTextElement,
  SpanDraggableText,
} from "./ElementEditable.styles";

/**
 * Elemento arrastrable (texto o imagen) sobre el lienzo, con react-moveable.
 * Todo su contenido y estilo vienen del store; el DOM ya no es la fuente de
 * verdad. Se reemplaza por Konva (Text + Transformer) en la Fase 4.
 */
const ElementEditable = ({ element, containerRef, setCheckInput }) => {
  const { id, whatTask, zIndex } = element;
  const isText = whatTask === "draggableText";
  const { overlayCanvasRef } = useEditorCanvas();
  const isEditingText = useEditorStore((state) => state.mode === "text");
  const isSelected = useEditorStore((state) => state.selectedElementId === id);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElement = useEditorStore((state) => state.updateElement);
  const refElement = useRef(null);
  const refEditable = useRef(null);
  const refMoveable = useRef(null);

  // Guarda en el store la geometría de Moveable (se usa al exportar) y el
  // transform CSS (para conservar la posición si el elemento se vuelve a montar).
  // useMemo: la versión con debounce tiene que ser la misma entre renders.
  const geometrySync = useMemo(() => {
    const sync = () => {
      const domElement = refElement.current;
      if (!domElement) return;
      // Ajusta la caja azul de Moveable al nuevo tamaño del elemento.
      refMoveable.current?.updateRect();
      updateElement(id, {
        ...getElementGeometry(domElement, refMoveable.current?.getManager()),
        cssTransform: domElement.style.transform || null,
      });
    };
    return { now: sync, debounced: debounce(sync, 150) };
  }, [id, updateElement]);

  useEffect(
    function initElement() {
      const domElement = refElement.current;
      if (element.cssTransform)
        domElement.style.transform = element.cssTransform;
      if (isText) {
        refEditable.current.innerText = element.text;
        updateElement(id, measureElement(domElement));
        if (!element.text) {
          refEditable.current.focus();
          setCheckInput(true);
        }
      } else if (element.realWidth === null) {
        setCheckInput(true);
      }
    },
    // Solo al montar: el contenido inicial del contentEditable se escribe una
    // vez; después lo controla el usuario y se sincroniza con onInput.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(
    function refreshMoveableBox() {
      geometrySync.now();
    },
    [
      geometrySync,
      element.fontFamily,
      element.fontSize,
      element.fontWeight,
      element.text,
    ]
  );

  const resetScroll = () => containerRef.current?.scrollTo({ left: 0, top: 0 });
  const select = () => selectElement(id);

  const textStyle = isText
    ? {
        fontFamily: element.fontFamily,
        fontSize: `${element.fontSize}px`,
        fontWeight: element.fontWeight,
        color: rgbaToCss(element.color),
      }
    : undefined;

  return (
    <>
      <DraggableTextElement
        ref={refElement}
        id={id}
        className={`target${id} draggable ${isText ? "draggableText" : ""}`}
        onClick={select}
        onTouchStart={select}
        zIndex={zIndex}
        style={textStyle}
      >
        {isText && (
          <SpanDraggableText
            ref={refEditable}
            contentEditable
            onInput={(e) =>
              updateElement(id, { text: e.currentTarget.innerText })
            }
            onKeyDown={resetScroll}
            onBlur={() => {
              resetScroll();
              setCheckInput(false);
            }}
            onTouchMove={(e) => {
              e.target.blur();
              setCheckInput(false);
            }}
          />
        )}
        {whatTask === "draggableImage" && (
          <img
            alt="elemento imagen"
            src={element.imageUrl}
            style={{ width: "100%", borderRadius: ".5rem" }}
            onLoad={geometrySync.now}
          />
        )}
      </DraggableTextElement>
      <Moveable
        ref={refMoveable}
        target={`.target${id}`}
        className={isSelected && isEditingText ? "editing" : "drawing"}
        scalable
        draggable
        rotatable
        keepRatio
        renderDirections={["w", "e", "s", "n"]}
        pinchable
        onDragStart={select}
        onScaleStart={select}
        onRotateStart={select}
        onDrag={geometrySync.debounced}
        onScale={geometrySync.debounced}
        onRotate={geometrySync.debounced}
        onRender={(e) => {
          e.target.style.cssText += e.cssText;
          resetScroll();
        }}
        onClick={(e) => {
          if (e.isDouble && e.inputTarget.contentEditable === "true") {
            e.inputTarget.focus();
            setCheckInput(true);
          }
        }}
        snappable
        snapDirections={{
          top: true,
          center: true,
          middle: true,
          bottom: true,
          left: true,
          right: true,
        }}
        elementSnapDirections={{
          top: true,
          center: true,
          middle: true,
          bottom: true,
        }}
        snapThreshold={4}
        elementGuidelines={[overlayCanvasRef]}
      />
    </>
  );
};

export default ElementEditable;
