import { useEffect, useEffectEvent, useState } from "react";
import { isImageFile } from "../utils/openImageFile";

const hasFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/**
 * Evita que soltar un archivo sobre la app haga que el navegador lo abra y
 * se salga del editor (se perdería el dibujo). Va siempre activo.
 */
export const usePreventFileDropNavigation = () => {
  useEffect(() => {
    const prevent = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);
};

/**
 * Abrir una imagen arrastrándola sobre la ventana o pegándola (Ctrl/⌘+V).
 * Devuelve si se está arrastrando un archivo encima, para mostrar el aviso.
 */
export const useImageDropAndPaste = (onImage: (file: File) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  // Siempre la versión más reciente, sin volver a suscribir los listeners.
  const handleImage = useEffectEvent(onImage);

  useEffect(() => {
    // dragenter/dragleave saltan en cada elemento hijo: se cuentan para saber
    // cuándo el archivo sale de verdad de la ventana.
    let depth = 0;
    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth += 1;
      setIsDragging(true);
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      depth = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (!isImageFile(file)) return;
      event.preventDefault();
      handleImage(file);
    };
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find(
        isImageFile
      );
      if (!file) return;
      event.preventDefault();
      handleImage(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  return isDragging;
};
