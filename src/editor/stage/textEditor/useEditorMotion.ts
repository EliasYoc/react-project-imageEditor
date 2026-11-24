import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import {
  editorPose,
  transformToPose,
  type ScreenPose,
} from "../../elements/textEditorMotion";

/** Duración de la transición entre el texto del lienzo y el editor. */
const MOTION_MS = 220;
/** Arranca rápido y frena al llegar. */
const MOTION_EASING = "cubic-bezier(0.2, 0, 0, 1)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Dónde está el editor (`textEditingBox`): `left` es su centro. */
interface EditorPlacement {
  left: number;
  top: number;
  scale: number;
}

interface MotionOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  placement: EditorPlacement;
  /** Ancho del editor sin escalar (`useFitTextarea`); 0 hasta que se mide. */
  contentWidth: number;
  /**
   * De dónde sale el editor al abrirse: el texto en el lienzo. null = sin
   * transición (un texto nuevo aparece directamente en el editor).
   */
  enterFrom: ScreenPose | null;
}

/** Sin `animate` (jsdom) o con el movimiento reducido, no hay transición. */
const canAnimate = (element: Element) =>
  typeof element.animate === "function" &&
  !window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Fotogramas que llevan el editor, colocado en `placement`, de una pose a otra. */
const travel = (
  from: ScreenPose,
  to: ScreenPose,
  placement: EditorPlacement
): Keyframe[] => [
  { transformOrigin: "0 0", transform: transformToPose(from, placement) },
  { transformOrigin: "0 0", transform: transformToPose(to, placement) },
];

/**
 * Transición entre el texto del lienzo y el editor: al volver a editar un
 * texto, el editor sale de donde está el texto (con su tamaño y su giro) y
 * llega a su sitio; al terminar, hace el camino contrario mientras la capa
 * se desvanece. Se anima el propio textarea (Web Animations API): se ve
 * nítido todo el camino y se puede escribir desde el primer momento.
 *
 * Devuelve `leaveTo`, para salir hacia la pose del texto ya guardado.
 */
export const useEditorMotion = ({
  textareaRef,
  backdropRef,
  placement,
  contentWidth,
  enterFrom,
}: MotionOptions) => {
  const animationsRef = useRef<Animation[]>([]);
  const hasEnteredRef = useRef(false);

  useLayoutEffect(
    function enterFromCanvas() {
      const textarea = textareaRef.current;
      // Una sola vez, en cuanto el editor tiene medidas: antes de pintarse,
      // así que no se ve en su sitio ni un instante.
      if (hasEnteredRef.current || contentWidth === 0 || !textarea) return;
      hasEnteredRef.current = true;
      if (!enterFrom || !canAnimate(textarea)) return;
      animationsRef.current.push(
        textarea.animate(
          travel(enterFrom, editorPose(placement, contentWidth), placement),
          { duration: MOTION_MS, easing: MOTION_EASING }
        )
      );
    },
    [textareaRef, contentWidth, enterFrom, placement]
  );

  useEffect(function cancelOnUnmount() {
    const animations = animationsRef.current;
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, []);

  /**
   * Lleva el editor a `to` (el texto en el lienzo) y desvanece la capa; al
   * llegar, llama a `onArrive`. Sin transición, la llama enseguida.
   */
  const leaveTo = (to: ScreenPose, onArrive: () => void) => {
    const textarea = textareaRef.current;
    if (!textarea || !canAnimate(textarea)) {
      onArrive();
      return;
    }
    // Si aún estaba entrando, sale desde su sitio.
    for (const animation of animationsRef.current) animation.cancel();
    // fill "forwards": se queda en el lienzo hasta que se quita.
    const timing = {
      duration: MOTION_MS,
      easing: MOTION_EASING,
      fill: "forwards",
    } as const;
    const leaving = textarea.animate(
      travel(editorPose(placement, contentWidth), to, placement),
      timing
    );
    animationsRef.current.push(leaving);
    const backdrop = backdropRef.current;
    if (backdrop) {
      animationsRef.current.push(
        backdrop.animate([{ opacity: 1 }, { opacity: 0 }], timing)
      );
    }
    leaving.onfinish = onArrive;
  };

  return { leaveTo };
};
