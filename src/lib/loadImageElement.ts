/**
 * Carga una imagen desde `src` y espera a que el navegador pueda dibujarla.
 * No guarda nada: para cargar cada imagen una sola vez, ver `imageCache.ts`.
 */
export const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    image.src = src;
  });
