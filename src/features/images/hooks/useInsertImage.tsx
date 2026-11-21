import { useRef, type ChangeEvent, type ReactElement } from "react";
import { toast } from "../../../components/ui/Toast";
import { IMAGE_OPEN_ERROR_MESSAGE } from "../../../lib/messages";
import { isAnimatedImage } from "../../../editor/elements/animatedImage";
import { loadImage } from "../../../editor/elements/imageCache";
import type { ImageAnimation, Size } from "../../../editor/model/types";
import { documentPointAtViewCenter } from "../../../editor/stage/viewStore";
import { editorStore } from "../../../editor/store/editorStore";
import { INSERTABLE_FILE_TYPES } from "../constants/insertableFiles";
import { isStickerFile } from "../utils/isStickerFile";
import { objectUrlFor } from "../utils/objectUrlFor";

/** Como mucho la mitad del documento, para que la imagen entre entera. */
const MAX_DOCUMENT_FRACTION = 0.5;

/** Lo que se sabe de un archivo al leerlo, o por qué no se puede insertar. */
type ReadFile =
  | { isValid: true; size: Size; animation: ImageAnimation }
  /** `message` es el aviso para el usuario. */
  | { isValid: false; message: string };

/**
 * Una imagen: su tamaño sale de abrirla. Si es un GIF (o WebP/PNG animado)
 * que el navegador abre pero no sabe animar, se inserta quieta: es mejor que
 * no insertarla.
 */
const readImage = async (file: File, src: string): Promise<ReadFile> => {
  const image = await loadImage(src);
  const isAnimated = await isAnimatedImage(file).catch((error: unknown) => {
    console.error(error);
    return false;
  });
  return {
    isValid: true,
    size: { width: image.naturalWidth, height: image.naturalHeight },
    animation: isAnimated ? "frames" : "none",
  };
};

/** Un sticker Lottie: se comprueba que lo sea y que no pida nada de fuera. */
const readSticker = async (file: File): Promise<ReadFile> => {
  // Se descarga con el primer sticker, como lottie-web.
  const { readLottieFile } =
    await import("../../../editor/elements/lottieFile");
  const result = await readLottieFile(file);
  if (!result.isValid) return result;
  return {
    isValid: true,
    size: { width: result.data.w, height: result.data.h },
    animation: "lottie",
  };
};

interface InsertImage {
  /** Abre el selector de archivos (llamar desde un clic o una opción de menú). */
  pickImage: () => void;
  /** El `<input type="file">` oculto: hay que dibujarlo siempre, fuera de menús. */
  fileInput: ReactElement;
}

/**
 * Inserta una imagen, un GIF o un sticker Lottie como elemento (encima del
 * dibujo) en el centro de la vista.
 *
 * Devuelve la función que abre el selector y el input oculto, para que el botón
 * o la opción de menú que la use la ponga donde quiera. El input va aparte
 * porque un menú desmonta sus opciones al cerrarse y el selector necesita que
 * el input siga montado cuando el usuario elige el archivo.
 */
export const useInsertImage = (): InsertImage => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo.
    event.target.value = "";
    if (!file) return;

    let url: Awaited<ReturnType<typeof objectUrlFor>> | null = null;
    try {
      url = await objectUrlFor(file);
      const { src } = url;
      const read = isStickerFile(file)
        ? await readSticker(file)
        : await readImage(file, src);
      if (!read.isValid) {
        url.release();
        toast.error(read.message);
        return;
      }
      // El tamaño natural decide su tamaño inicial en el documento.
      const { width, height } = read.size;
      const { canvasSize, addImage } = editorStore.getState();
      const fit = Math.min(
        1,
        (canvasSize.width * MAX_DOCUMENT_FRACTION) / width,
        (canvasSize.height * MAX_DOCUMENT_FRACTION) / height
      );
      addImage({
        src,
        width: width * fit,
        height: height * fit,
        center: documentPointAtViewCenter(),
        animation: read.animation,
      });
      url.keep();
    } catch (error) {
      url?.release();
      console.error(error);
      toast.error(IMAGE_OPEN_ERROR_MESSAGE);
    }
  };

  return {
    pickImage: () => inputRef.current?.click(),
    fileInput: (
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={INSERTABLE_FILE_TYPES}
        onChange={handleChange}
      />
    ),
  };
};
