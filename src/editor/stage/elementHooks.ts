import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { useEffect, useReducer, type RefObject } from "react";
import { ensureFont, isFontReady } from "../elements/fontLoader";
import type { FontId } from "../elements/fonts";
import {
  getLoadedImageAnimation,
  loadImageAnimation,
} from "../elements/imageAnimations";
import { getLoadedImage, loadImage } from "../elements/imageCache";
import { stickerResolution } from "../elements/stickerResolution";
import type { ImageElement } from "../model/types";
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

/** La imagen cargada (null mientras carga, o sin `src`: un sticker no lo es). */
export const useLoadedImage = (src: string | null) => {
  const forceRender = useForceRender();
  useEffect(() => {
    if (!src || getLoadedImage(src)) return;
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
  return src ? getLoadedImage(src) : null;
};

/** La animación ya abierta (null mientras se abre, si falla o si no se mueve). */
const useOpenedAnimation = ({ src, animation }: ImageElement) => {
  const forceRender = useForceRender();
  useEffect(() => {
    if (animation === "none" || getLoadedImageAnimation(src)) return;
    let isActive = true;
    loadImageAnimation(src, animation)
      .then(() => {
        if (isActive) forceRender();
      })
      .catch((error) => console.error(error));
    return () => {
      isActive = false;
    };
  }, [src, animation, forceRender]);
  return animation === "none" ? null : getLoadedImageAnimation(src);
};

/**
 * Anima un GIF o un sticker del lienzo: sigue el reloj de la animación y
 * repinta la capa del nodo cuando cambia de fotograma. Con el editor oculto
 * (en el inicio) o mientras se exporta un video, se para: no gasta lo que
 * necesita la exportación.
 *
 * `screenPixels` es el lado mayor con el que se ve: un sticker se pinta a esa
 * resolución (por escalones, para no repintarlo en cada paso del zoom).
 *
 * Devuelve el canvas con el fotograma actual, o null mientras se abre (o si
 * no se pudo): entonces un GIF se muestra quieto y un sticker no se ve.
 */
export const useImageAnimation = (
  element: ImageElement,
  nodeRef: RefObject<KonvaImageNode | null>,
  screenPixels: number
) => {
  const animation = useOpenedAnimation(element);
  const video = useEditorStore(selectVideo);
  const isPlaying = useEditorStore(
    (state) => state.mode !== "home" && state.status !== "exportingVideo"
  );
  const resolution = stickerResolution(screenPixels);

  useEffect(() => {
    if (!animation) return;
    return animation.onFrame(() => nodeRef.current?.getLayer()?.batchDraw());
  }, [animation, nodeRef]);

  useEffect(() => animation?.showAtSize(resolution), [animation, resolution]);

  useEffect(() => {
    if (!animation || !isPlaying) return;
    return onAnimationTick(video, animation.showFrameAt);
  }, [animation, isPlaying, video]);

  return animation?.canvas ?? null;
};
