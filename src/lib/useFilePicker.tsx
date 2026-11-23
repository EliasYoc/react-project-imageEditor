import { useRef, type ChangeEvent, type ReactElement } from "react";

interface FilePickerOptions {
  /** Tipos de archivo que acepta el selector (el atributo `accept`). */
  accept: string;
  /** Recibe el archivo elegido; no se llama si se cancela el selector. */
  onFile: (file: File) => void | Promise<void>;
}

interface FilePicker {
  /** Abre el selector de archivos (llamar desde un clic o una opción de menú). */
  openPicker: () => void;
  /**
   * El `<input type="file">` oculto: hay que dibujarlo siempre, fuera de
   * menús (un menú desmonta sus opciones al cerrarse y el selector necesita que
   * el input siga montado cuando el usuario elige el archivo).
   */
  fileInput: ReactElement;
}

/**
 * Un selector de un solo archivo. El input va oculto y lo abre un botón: así
 * el botón recibe foco y funciona con teclado (un `<label>` no).
 */
export const useFilePicker = ({
  accept,
  onFile,
}: FilePickerOptions): FilePicker => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Permite volver a elegir el mismo archivo.
    input.value = "";
    if (file) void onFile(file);
  };

  return {
    openPicker: () => inputRef.current?.click(),
    fileInput: (
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        onChange={handleChange}
      />
    ),
  };
};
