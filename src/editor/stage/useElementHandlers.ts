import type { KonvaEventObject } from "konva/lib/Node";
import { useMemo, useRef } from "react";
import { snapToDocument } from "../elements/snapping";
import type { EditorElement } from "../model/types";
import { editorStore } from "../store/editorStore";
import { viewStore } from "./viewStore";

/** Distancia (en píxeles de pantalla) a la que un elemento se "imanta". */
const SNAP_SCREEN_PX = 8;

export const NO_GUIDES = {
  vertical: [] as number[],
  horizontal: [] as number[],
};

/**
 * Eventos de los elementos (solo en modo Texto): seleccionar, editar el texto
 * (tocar uno ya seleccionado o doble clic), arrastrar con imán a los bordes y
 * al centro del documento, y guardar en el historial al soltar.
 *
 * Devuelve siempre el mismo objeto (la escala de la vista se lee al arrastrar,
 * no al renderizar): así los nodos no se vuelven a renderizar en cada render
 * de la capa.
 */
export const useElementHandlers = (
  setGuides: (guides: typeof NO_GUIDES) => void
) => {
  // ¿El elemento ya estaba seleccionado al apoyar el dedo? (tocar otra vez = editar)
  const wasSelectedRef = useRef(false);

  return useMemo(
    () => ({
      forElement: (element: EditorElement) => {
        const { id } = element;
        const isText = element.whatTask === "text";
        const edit = () => {
          if (isText) editorStore.getState().startTextEditing(id);
        };
        return {
          onPointerDown: (event: KonvaEventObject<PointerEvent>) => {
            // El segundo dedo de un pellizco no cambia la selección: el
            // pellizco es para el elemento que tocó el primero.
            if (!event.evt.isPrimary) return;
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
              SNAP_SCREEN_PX / viewStore.getState().view.scale
            );
            if (snap.dx || snap.dy) {
              node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy });
            }
            setGuides(snap);
          },
          onDragEnd: (event: KonvaEventObject<DragEvent>) => {
            setGuides(NO_GUIDES);
            const node = event.target;
            editorStore
              .getState()
              .editElement(id, { x: node.x(), y: node.y() });
          },
        };
      },
    }),
    [setGuides]
  );
};
