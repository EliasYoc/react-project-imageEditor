import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Segmented } from "../../components/ui/Segmented";
import { ensureFont } from "../../editor/elements/fontLoader";
import { FONTS } from "../../editor/elements/fonts";
import type { TextElement } from "../../editor/model/types";
import { useEditorStore } from "../../editor/store/editorStore";
import { BOLD_WEIGHT, NORMAL_WEIGHT, isBold } from "./fontWeight";
import styles from "./TextPanels.module.css";

const WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Negrita" },
] as const;

/**
 * Fuente y grosor del texto seleccionado. Cada fuente se muestra escrita en
 * su propio tipo; al abrir la lista se descargan todas (son WOFF2 pequeños y
 * solo el subconjunto latino).
 */
const FontPicker = ({ text }: { text: TextElement }) => {
  const editElement = useEditorStore((state) => state.editElement);

  useEffect(function loadPreviews() {
    for (const font of FONTS) void ensureFont(font.id, NORMAL_WEIGHT);
  }, []);

  return (
    <div className={styles.panel}>
      <Segmented
        label="Grosor"
        value={isBold(text) ? "bold" : "normal"}
        onChange={(weight) =>
          editElement(text.id, {
            fontWeight: weight === "bold" ? BOLD_WEIGHT : NORMAL_WEIGHT,
          })
        }
        items={WEIGHTS}
      />
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
    </div>
  );
};

export default FontPicker;
