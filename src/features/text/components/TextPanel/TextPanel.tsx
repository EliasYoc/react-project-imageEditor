import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import {
  Segmented,
  type SegmentedItem,
} from "../../../../components/ui/Segmented";
import type { TextAlign, TextElement } from "../../../../editor/model/types";
import { useEditorStore } from "../../../../editor/store/editorStore";
import { BOLD_WEIGHT, NORMAL_WEIGHT, isBold } from "../../utils/fontWeight";
import FontPicker from "../FontPicker/FontPicker";
import TextStylePanel from "../TextStylePanel/TextStylePanel";
import styles from "./TextPanel.module.css";

const WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Negrita" },
] as const;

const ALIGNMENTS: readonly SegmentedItem<TextAlign>[] = [
  { value: "left", label: "Alinear a la izquierda", icon: AlignLeft },
  { value: "center", label: "Centrar", icon: AlignCenter },
  { value: "right", label: "Alinear a la derecha", icon: AlignRight },
];

/**
 * Panel "Fuente y estilo" del texto seleccionado, de arriba abajo: grosor y
 * alineación en una fila, la lista de fuentes y la sección «Estilo»
 * (interlineado y efectos).
 */
const TextPanel = ({ text }: { text: TextElement }) => {
  const editElement = useEditorStore((state) => state.editElement);

  return (
    <div className={styles.panel}>
      <div className={styles.basics}>
        <Segmented
          label="Grosor"
          value={isBold(text) ? "bold" : "normal"}
          onChange={(weight) =>
            editElement(text.id, {
              fontWeight: weight === "bold" ? BOLD_WEIGHT : NORMAL_WEIGHT,
            })
          }
          items={WEIGHTS}
          size="sm"
        />
        <Segmented
          label="Alineación"
          value={text.align}
          onChange={(align) => editElement(text.id, { align })}
          items={ALIGNMENTS}
          isIconOnly
          size="sm"
        />
      </div>
      <FontPicker text={text} />
      <section className={styles.style} aria-label="Estilo">
        <h3 className={styles.title}>Estilo</h3>
        <TextStylePanel text={text} />
      </section>
    </div>
  );
};

export default TextPanel;
