import { ToggleGroup } from "radix-ui";
import { useEffect } from "react";
import { Button } from "../../../../components/ui/Button";
import { ensureFont } from "../../../../editor/elements/fontLoader";
import { FONTS, type FontId } from "../../../../editor/elements/fonts";
import type { TextElement } from "../../../../editor/model/types";
import { useEditorStore } from "../../../../editor/store/editorStore";
import { NORMAL_WEIGHT } from "../../utils/fontWeight";
import styles from "./FontPicker.module.css";

/**
 * Lista de fuentes del texto seleccionado. Cada fuente se muestra escrita en
 * su propio tipo; al abrir la lista se descargan todas (son WOFF2 pequeños y
 * solo el subconjunto latino).
 *
 * Es un grupo de opción única accesible: Tab entra en la fuente elegida, las
 * flechas mueven el foco entre fuentes y Enter o Espacio elige la enfocada
 * (antes cada fuente era una parada de Tab).
 */
const FontPicker = ({ text }: { text: TextElement }) => {
  const editElement = useEditorStore((state) => state.editElement);

  useEffect(function loadPreviews() {
    for (const font of FONTS) void ensureFont(font.id, NORMAL_WEIGHT);
  }, []);

  return (
    <ToggleGroup.Root
      type="single"
      aria-label="Fuentes"
      value={text.fontId}
      // Volver a pulsar la fuente elegida no la deselecciona (llegaría "").
      onValueChange={(fontId) =>
        fontId && editElement(text.id, { fontId: fontId as FontId })
      }
      className={styles.fontList}
    >
      {FONTS.map((font) => (
        <ToggleGroup.Item key={font.id} value={font.id} asChild>
          <Button
            className={styles.font}
            style={{ fontFamily: font.family, fontWeight: text.fontWeight }}
          >
            {font.label}
          </Button>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
};

export default FontPicker;
