import { ImagePlus, Palette } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { IconButton } from "../../components/ui/Button";
import { useEditorStore } from "../../editor/store/editorStore";
import styles from "./HomeToolbar.module.css";
import { openImageFile } from "./openImageFile";

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
      loadPhoto(await openImageFile(file));
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
