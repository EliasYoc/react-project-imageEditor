import { useEffect, useReducer } from "react";
import { ensureFont, isFontReady } from "../elements/fontLoader";
import type { FontId } from "../elements/fonts";
import { getLoadedImage, loadImage } from "../elements/imageCache";

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
