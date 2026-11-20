import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { useEffect, useReducer, type RefObject } from "react";
import {
  getLoadedAnimatedImage,
  loadAnimatedImage,
} from "../elements/animatedImage";
import { ensureFont, isFontReady } from "../elements/fontLoader";
import type { FontId } from "../elements/fonts";
import { getLoadedImage, loadImage } from "../elements/imageCache";
import { useEditorStore } from "../store/editorStore";
import { selectVideo } from "../store/selectors";
import { onAnimationTick } from "./animationClock";

/** Fuerza un render cuando termina algo asíncrono (carga de fuente o imagen). */
const useForceRender = () => useReducer((count: number) => count + 1, 0)[1];

/**
 * La fuente ya se puede usar para medir. Si no, la descarga y vuelve a
 * renderizar al terminar: el nodo de Konva se crea de nuevo y mide bien.
 */
export const useFontReady = (fontId: FontId, weight: number) => {
  const forceRender = useForceRender();
  useEffect(() => {
    if (isFontReady(fontId, weight)) return;
    let isActive = true;
    ensureFont(fontId, weight).then((ready) => {
      if (isActive && ready) forceRender();
    });
    return () => {
      isActive = false;
    };
  }, [fontId, weight, forceRender]);
  return isFontReady(fontId, weight);
};

/** La imagen cargada (o null mientras carga). */
export const useLoadedImage = (src: string) => {
  const forceRender = useForceRender();
  useEffect(() => {
    if (getLoadedImage(src)) return;
    let isActive = true;
    loadImage(src)
      .then(() => {
        if (isActive) forceRender();
      })
      .catch((error) => console.error(error));
    return () => {
      isActive = false;
    };
  }, [src, forceRender]);
  return getLoadedImage(src);
};

/** La imagen animada ya abierta (null mientras se abre, si falla o sin `src`). */
const useAnimatedImage = (src: string | null) => {
  const forceRender = useForceRender();
  useEffect(() => {
    if (!src || getLoadedAnimatedImage(src)) return;
    let isActive = true;
    loadAnimatedImage(src)
      .then(() => {
        if (isActive) forceRender();
      })
      .catch((error) => console.error(error));
    return () => {
      isActive = false;
    };
  }, [src, forceRender]);
  return src ? getLoadedAnimatedImage(src) : null;
};

/**
 * Anima un GIF del lienzo (`src` null si la imagen no es animada): sigue el
 * reloj de la animación y repinta la capa del nodo cuando cambia de
 * fotograma. Con el editor oculto (en el inicio) no gasta nada.
 *
 * Devuelve el canvas con el fotograma actual, o null mientras se abre (o si
 * no se pudo): entonces se muestra la imagen quieta.
 */
export const useImageAnimation = (
  src: string | null,
  nodeRef: RefObject<KonvaImageNode | null>
) => {
  const animation = useAnimatedImage(src);
  const video = useEditorStore(selectVideo);
  const isEditorVisible = useEditorStore((state) => state.mode !== "home");

  useEffect(() => {
    if (!animation) return;
    return animation.onFrame(() => nodeRef.current?.getLayer()?.batchDraw());
  }, [animation, nodeRef]);

  useEffect(() => {
    if (!animation || !isEditorVisible) return;
    return onAnimationTick(video, animation.showFrameAt);
  }, [animation, isEditorVisible, video]);

  return animation?.canvas ?? null;
};
