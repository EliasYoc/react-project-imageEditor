import { createContext, useContext } from "react";

/**
 * Refs a los dos <canvas> del editor (el principal y la capa de dibujo).
 *
 * Los refs no son estado: cambian sin provocar renders. Por eso NO van en el
 * store, y el valor del contexto nunca cambia (los consumidores no se vuelven a
 * renderizar por él). `ref.current` se lee solo en efectos y handlers, nunca
 * durante el render. En la Fase 2 se sustituyen por el Stage de Konva.
 */
export const EditorCanvasContext = createContext(null);

export const useEditorCanvas = () => {
  const value = useContext(EditorCanvasContext);
  if (!value) {
    throw new Error(
      "useEditorCanvas debe usarse dentro de <EditorCanvasProvider>"
    );
  }
  return value;
};
