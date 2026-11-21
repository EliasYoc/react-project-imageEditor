import { useEffect } from "react";
import { Button } from "../../../../components/ui/Button";
import { ensureFont } from "../../../../editor/elements/fontLoader";
import { FONTS } from "../../../../editor/elements/fonts";
import type { TextElement } from "../../../../editor/model/types";
import { useEditorStore } from "../../../../editor/store/editorStore";
import { NORMAL_WEIGHT } from "../../utils/fontWeight";
import styles from "./FontPicker.module.css";

/**
 * Lista de fuentes del texto seleccionado. Cada fuente se muestra escrita en
 * su propio tipo; al abrir la lista se descargan todas (son WOFF2 pequeños y
 * solo el subconjunto latino).
 */
const FontPicker = ({ text }: { text: TextElement }) => {
  const editElement = useEditorStore((state) => state.editElement);

  useEffect(function loadPreviews() {
    for (const font of FONTS) void ensureFont(font.id, NORMAL_WEIGHT);
  }, []);

  return (
    <div className={styles.fontList} role="group" aria-label="Fuentes">
      {FONTS.map((font) => (
        <Button
          key={font.id}
          className={styles.font}
          style={{ fontFamily: font.family, fontWeight: text.fontWeight }}
          aria-pressed={font.id === text.fontId}
          onClick={() => editElement(text.id, { fontId: font.id })}
        >
          {font.label}
        </Button>
      ))}
    </div>
  );
};

export default FontPicker;
