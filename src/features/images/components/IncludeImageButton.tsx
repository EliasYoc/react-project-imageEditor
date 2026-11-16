import { ImagePlus } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { IconButton } from "../../../components/ui/Button";
import { toast } from "../../../components/ui/Toast";
import { loadImage } from "../../../editor/elements/imageCache";
import { documentPointAtViewCenter } from "../../../editor/stage/viewStore";
import { editorStore } from "../../../editor/store/editorStore";

/** Como mucho la mitad del documento, para que la imagen entre entera. */
const MAX_DOCUMENT_FRACTION = 0.5;

/** Inserta una imagen como elemento (encima del dibujo) en el centro de la vista. */
const IncludeImageButton = () => {
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
      toast.error("No se pudo abrir la imagen");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
      <IconButton
        icon={ImagePlus}
        aria-label="Insertar una imagen"
        onClick={() => inputRef.current?.click()}
      />
    </>
  );
};

export default IncludeImageButton;
