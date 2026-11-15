import Konva from "konva/lib/Core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Label as KonvaLabel } from "konva/lib/shapes/Label";
import type { Text as KonvaText } from "konva/lib/shapes/Text";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import "konva/lib/shapes/Label";
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Text";
import "konva/lib/shapes/Transformer";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Image as KonvaImage,
  Label,
  Layer,
  Line,
  Tag,
  Text,
  Transformer,
} from "react-konva/lib/ReactKonvaCore";
import { imageNodeConfig, textNodeConfig } from "../elements/nodeConfig";
import { snapToDocument } from "../elements/snapping";
import { applyTextFill } from "../elements/textGradient";
import type { View } from "../engine/viewport";
import type { EditorElement, ImageElement, TextElement } from "../model/types";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectElements } from "../store/selectors";
import { useFontReady, useLoadedImage } from "./elementHooks";

/** Un arrastre empieza tras moverse unos píxeles: un toque sigue siendo un toque. */
Konva.dragDistance = 4;

/** Distancia (en píxeles de pantalla) a la que un elemento se "imanta". */
const SNAP_SCREEN_PX = 8;
const GUIDE_COLOR = "rgb(255, 59, 96)";
const SELECTION_COLOR = "rgb(68, 171, 255)";
const NO_GUIDES = { vertical: [] as number[], horizontal: [] as number[] };

const TEXT_ANCHORS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "middle-left",
  "middle-right",
];
const IMAGE_ANCHORS = ["top-left", "top-right", "bottom-left", "bottom-right"];

interface NodeProps<T extends EditorElement> {
  element: T;
  interactive: boolean;
  isEditing: boolean;
  handlers: ReturnType<typeof useElementHandlers>;
}

const TextNode = ({
  element,
  interactive,
  isEditing,
  handlers,
}: NodeProps<TextElement>) => {
  const fontReady = useFontReady(element.fontId, element.fontWeight);
  const config = textNodeConfig(element);
  const textRef = useRef<KonvaText>(null);

  // El degradado depende del tamaño que Konva acaba de medir: se aplica
  // después de cada render (barato: unos pocos atributos).
  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    applyTextFill(text, element.gradient);
    text.getLayer()?.batchDraw();
  });

  return (
    <Label
      // Al cargar la fuente, el nodo se crea de nuevo y Konva mide bien.
      key={`${element.id}:${fontReady}`}
      {...config.label}
      draggable={interactive && !isEditing}
      visible={!isEditing}
      {...handlers.forElement(element)}
    >
      <Tag {...config.tag} />
      <Text ref={textRef} {...config.text} />
    </Label>
  );
};

const ImageNode = ({
  element,
  interactive,
  handlers,
}: NodeProps<ImageElement>) => {
  const image = useLoadedImage(element.src);
  if (!image) return null;
  return (
    <KonvaImage
      {...imageNodeConfig(element)}
      image={image}
      draggable={interactive}
      {...handlers.forElement(element)}
    />
  );
};

/**
 * Eventos de los elementos (solo en modo Texto): seleccionar, editar el texto
 * (tocar uno ya seleccionado o doble clic), arrastrar con imán a los bordes y
 * al centro del documento, y guardar en el historial al soltar.
 */
const useElementHandlers = (
  view: View,
  setGuides: (guides: typeof NO_GUIDES) => void
) => {
  // ¿El elemento ya estaba seleccionado al apoyar el dedo? (tocar otra vez = editar)
  const wasSelectedRef = useRef(false);

  return {
    forElement: (element: EditorElement) => {
      const { id } = element;
      const isText = element.whatTask === "text";
      const edit = () => {
        if (isText) editorStore.getState().startTextEditing(id);
      };
      return {
        onPointerDown: () => {
          const { selectedElementId, selectElement } = editorStore.getState();
          wasSelectedRef.current = selectedElementId === id;
          selectElement(id);
        },
        onClick: () => wasSelectedRef.current && edit(),
        onTap: () => wasSelectedRef.current && edit(),
        onDblClick: edit,
        onDblTap: edit,
        onDragMove: (event: KonvaEventObject<DragEvent>) => {
          const node = event.target;
          const layer = node.getLayer();
          if (!layer) return;
          const box = node.getClientRect({ relativeTo: layer });
          const snap = snapToDocument(
            box,
            editorStore.getState().canvasSize,
            SNAP_SCREEN_PX / view.scale
          );
          if (snap.dx || snap.dy) {
            node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy });
          }
          setGuides(snap);
        },
        onDragEnd: (event: KonvaEventObject<DragEvent>) => {
          setGuides(NO_GUIDES);
          const node = event.target;
          editorStore.getState().editElement(id, { x: node.x(), y: node.y() });
        },
      };
    },
  };
};

interface ElementsLayerProps {
  view: View;
  /** Modo Texto: los elementos se pueden seleccionar, mover y transformar. */
  interactive: boolean;
}

/**
 * Textos e imágenes como nodos de Konva, en coordenadas del documento (la
 * capa lleva la transformación de la vista, como la pintura).
 *
 * El Transformer (marco de selección) va en una capa aparte sin
 * transformar: así sus asas miden lo mismo con cualquier zoom.
 */
const ElementsLayer = ({ view, interactive }: ElementsLayerProps) => {
  const elements = useEditorStore(selectElements);
  const selectedId = useEditorStore((state) => state.selectedElementId);
  const editingId = useEditorStore((state) => state.editingTextId);
  const layerRef = useRef<KonvaLayer>(null);
  const transformerRef = useRef<KonvaTransformer>(null);
  const [guides, setGuides] = useState(NO_GUIDES);
  const handlers = useElementHandlers(view, setGuides);

  const ordered = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );
  const selected = elements.find((element) => element.id === selectedId);
  const showTransformer = interactive && selected && selectedId !== editingId;

  // Después de cada render: el nodo seleccionado puede haberse creado de nuevo
  // (p. ej. al cargar su fuente), así que se vuelve a enganchar al marco.
  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer) return;
    const node =
      showTransformer && selectedId
        ? layer.findOne(
            (candidate: Konva.Node) => candidate.id() === selectedId
          )
        : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  });

  const onTransform = () => {
    const transformer = transformerRef.current;
    const node = transformer?.nodes()[0];
    if (!transformer || !node || selected?.whatTask !== "text") return;
    // Asas laterales de un texto: cambian el ancho de ajuste (el texto se
    // reparte en más o menos líneas) en lugar de estirar las letras.
    const anchor = transformer.getActiveAnchor();
    if (anchor !== "middle-left" && anchor !== "middle-right") return;
    const label = node as KonvaLabel;
    const text = label.getText();
    const width = Math.max(
      selected.fontSize,
      (text.width() * label.scaleX()) / label.scaleY()
    );
    text.width(width);
    label.scaleX(label.scaleY());
    // El texto cambia de forma: el degradado se reparte en la nueva caja.
    applyTextFill(text, selected.gradient);
  };

  const onTransformEnd = () => {
    const node = transformerRef.current?.nodes()[0];
    if (!node || !selected) return;
    const patch = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scale: node.scaleY(),
    };
    if (selected.whatTask === "text") {
      const text = (node as KonvaLabel).getText();
      const width = text.getAttr("width");
      editorStore.getState().editElement(selected.id, {
        ...patch,
        // Solo si se fijó un ancho (con las asas laterales).
        width: typeof width === "number" ? width : selected.width,
      });
    } else {
      editorStore.getState().editElement(selected.id, patch);
    }
  };

  return (
    <>
      <Layer
        ref={layerRef}
        x={view.x}
        y={view.y}
        scaleX={view.scale}
        scaleY={view.scale}
        listening={interactive}
      >
        {ordered.map((element) =>
          element.whatTask === "text" ? (
            <TextNode
              key={element.id}
              element={element}
              interactive={interactive}
              isEditing={element.id === editingId}
              handlers={handlers}
            />
          ) : (
            <ImageNode
              key={element.id}
              element={element}
              interactive={interactive}
              isEditing={false}
              handlers={handlers}
            />
          )
        )}
        {guides.vertical.map((x) => (
          <Line
            key={`v${x}`}
            points={[x, -1e5, x, 1e5]}
            stroke={GUIDE_COLOR}
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            listening={false}
          />
        ))}
        {guides.horizontal.map((y) => (
          <Line
            key={`h${y}`}
            points={[-1e5, y, 1e5, y]}
            stroke={GUIDE_COLOR}
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            listening={false}
          />
        ))}
      </Layer>
      <Layer listening={interactive}>
        <Transformer
          ref={transformerRef}
          visible={Boolean(showTransformer)}
          enabledAnchors={
            selected?.whatTask === "text" ? TEXT_ANCHORS : IMAGE_ANCHORS
          }
          keepRatio
          flipEnabled={false}
          rotationSnaps={[0, 90, 180, 270]}
          rotateAnchorOffset={28}
          anchorSize={14}
          anchorCornerRadius={7}
          anchorStroke={SELECTION_COLOR}
          anchorFill="#fff"
          borderStroke={SELECTION_COLOR}
          padding={4}
          boundBoxFunc={(oldBox, newBox) =>
            Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12
              ? oldBox
              : newBox
          }
          onTransform={onTransform}
          onTransformEnd={onTransformEnd}
        />
      </Layer>
    </>
  );
};

export default ElementsLayer;
