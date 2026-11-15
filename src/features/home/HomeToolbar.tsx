import { ImagePlus, Palette } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { IconButton } from "../../components/ui/Button";
import { useEditorStore } from "../../editor/store/editorStore";
import { createCanvas, get2dContext } from "../../lib/canvas";
import {
  readFile,
  reduceAspectRatioQualityOfIncomingImage,
} from "../../lib/helper";
import styles from "./HomeToolbar.module.css";

/** Las imágenes más grandes que esto se reducen a MAX_IMAGE_SIDE píxeles. */
const HEAVY_IMAGE_SIDE = 2800;
const MAX_IMAGE_SIDE = 2048;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen"));
    image.src = src;
  });

/** Barra de la pantalla de inicio: abrir el editor o cargar una imagen. */
const HomeToolbar = () => {
  const setMode = useEditorStore((state) => state.setMode);
  const setStatus = useEditorStore((state) => state.setStatus);
  const loadPhoto = useEditorStore((state) => state.loadPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setStatus("loading");

    try {
      const { result } = await readFile({ file });
      const image = await loadImage(result as string);

      const isHeavy =
        image.width > HEAVY_IMAGE_SIDE || image.height > HEAVY_IMAGE_SIDE;
      const { newWidth: width, newHeight: height } = isHeavy
        ? reduceAspectRatioQualityOfIncomingImage({
            options: image,
            expectedMaxPixelsSize: MAX_IMAGE_SIDE,
          })
        : { newWidth: image.width, newHeight: image.height };

      // Copia con el tamaño del documento para mostrar en el lienzo; la
      // original se usa al exportar. Es un canvas, no un dataURL: no hay que
      // codificarla a JPEG ni perder calidad.
      const preview = createCanvas({ width, height });
      get2dContext(preview).drawImage(
        image,
        0,
        0,
        preview.width,
        preview.height
      );

      loadPhoto({
        source: image,
        preview,
        mimeType: file.type,
        size: { width: preview.width, height: preview.height },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("idle");
      // Permite volver a elegir el mismo archivo.
      input.value = "";
    }
  };

  return (
    <div className={styles.toolbar}>
      {/* Cambia de modo al instante. Antes esperaba al final de la animación
          (onTransitionEnd) y, si el navegador no animaba, la app se atascaba. */}
      <IconButton
        icon={Palette}
        aria-label="Abrir el editor"
        tooltipSide="top"
        onClick={() => setMode("draw")}
      />
      {/* El <input type="file"> está oculto; el botón visible lo abre. Así el
          botón recibe foco y funciona con teclado (un <label> no). */}
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleLoadImage}
      />
      <IconButton
        icon={ImagePlus}
        aria-label="Abrir una imagen"
        tooltipSide="top"
        onClick={() => fileInputRef.current?.click()}
      />
    </div>
  );
};

export default HomeToolbar;
