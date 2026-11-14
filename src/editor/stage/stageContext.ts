import { createContext, useContext, type RefObject } from "react";

export interface StageHandles {
  /**
   * Div invisible que ocupa exactamente el rectángulo del documento en
   * pantalla. Sirve de guía para el snapping de los elementos y para convertir
   * su posición a píxeles del documento al exportar.
   */
  documentFrameRef: RefObject<HTMLDivElement | null>;
}

/**
 * Referencias DOM del lienzo que necesitan partes de la app que no son hijas
 * del lienzo (p. ej. la cabecera, al exportar). El valor nunca cambia, así que
 * no provoca renders; `ref.current` se lee solo en efectos y handlers.
 */
export const StageContext = createContext<StageHandles | null>(null);

export const useStageHandles = () => {
  const value = useContext(StageContext);
  if (!value) {
    throw new Error("useStageHandles debe usarse dentro de <StageProvider>");
  }
  return value;
};
