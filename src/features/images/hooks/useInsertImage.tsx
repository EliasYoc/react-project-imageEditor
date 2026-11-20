import { useRef, type ChangeEvent, type ReactElement } from "react";
import { toast } from "../../../components/ui/Toast";
import { IMAGE_OPEN_ERROR_MESSAGE } from "../../../lib/messages";
import { loadImage } from "../../../editor/elements/imageCache";
import { documentPointAtViewCenter } from "../../../editor/stage/viewStore";
import { editorStore } from "../../../editor/store/editorStore";

/** Como mucho la mitad del documento, para que la imagen entre entera. */
const MAX_DOCUMENT_FRACTION = 0.5;

interface InsertImage {
  /** Abre el selector de archivos (llamar desde un clic o una opción de menú). */
  pickImage: () => void;
  /** El `<input type="file">` oculto: hay que dibujarlo siempre, fuera de menús. */
  fileInput: ReactElement;
}

/**
 * Inserta una imagen como elemento (encima del dibujo) en el centro de la vista.
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

    const src = URL.createObjectURL(file);
    try {
      // El tamaño natural de la imagen decide su tamaño inicial en el documento.
      const image = await loadImage(src);
      const { canvasSize, addImage } = editorStore.getState();
      const fit = Math.min(
        1,
        (canvasSize.width * MAX_DOCUMENT_FRACTION) / image.naturalWidth,
        (canvasSize.height * MAX_DOCUMENT_FRACTION) / image.naturalHeight
      );
      addImage({
        src,
        width: image.naturalWidth * fit,
        height: image.naturalHeight * fit,
        center: documentPointAtViewCenter(),
      });
    } catch (error) {
      URL.revokeObjectURL(src);
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
        accept="image/*"
        onChange={handleChange}
      />
    ),
  };
};
