import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { getFont } from "../elements/fonts";
import { textPadding } from "../elements/nodeConfig";
import { textEditingBox } from "../elements/textEditorBox";
import { textEditorPaint } from "../elements/textGradient";
import { visibleArea } from "../engine/viewport";
import { isTextElement, type TextElement } from "../model/types";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectElements } from "../store/selectors";
import styles from "./EditorStage.module.css";
import { useViewStore } from "./viewStore";

/**
 * Textarea para escribir un texto, con el mismo tamaño de letra, fuente y
 * color que el nodo de Konva. Mientras se edita, el nodo se oculta y el
 * textarea no se pone encima: sale horizontal, centrado y un poco arriba
 * (`textEditingBox`), para leerlo aunque el texto esté girado o lejos. Al
 * terminar, el texto sigue donde estaba.
 *
 * Se confirma al salir (tocar fuera) o con Ctrl/⌘ + Enter; Escape cancela.
 * Un texto nuevo que se deja vacío se descarta sin dejar rastro.
 */
const TextEditor = ({ element }: { element: TextElement }) => {
  const view = useViewStore((state) => state.view);
  const stageSize = useViewStore((state) => state.stageSize);
  const insets = useViewStore((state) => state.insets);
  const [draft, setDraft] = useState(element.text);
  // Ancho del textarea sin escalar: si no cabe en pantalla, se encoge.
  const [contentWidth, setContentWidth] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFinishedRef = useRef(false);

  useLayoutEffect(function focusOnOpen() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // preventScroll: en el móvil, el navegador no debe desplazar la página.
    textarea.focus({ preventScroll: true });
    // El cursor va al final y no se selecciona el texto: escribir no lo borra.
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, []);

  useLayoutEffect(
    function fitToContent() {
      const textarea = textareaRef.current;
      if (!textarea) return;
      // Ancho automático: crece con la línea más larga (como el texto en Konva).
      if (element.width === null) {
        textarea.style.width = "0px";
        textarea.style.width = `${Math.max(
          textarea.scrollWidth,
          element.fontSize
        )}px`;
      }
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
      setContentWidth(textarea.offsetWidth);
    },
    [draft, element.width, element.fontSize]
  );

  const { scale, ...position } = textEditingBox(
    contentWidth,
    view.scale * element.scale,
    visibleArea(stageSize, insets)
  );

  const finish = (save: boolean) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    const { editElement, removeElement, discardNewText, stopTextEditing } =
      editorStore.getState();
    const text = save ? draft : element.text;
    stopTextEditing();
    if (!text.trim()) {
      // Vacío: un texto nuevo desaparece; uno que ya existía se elimina
      // (se puede deshacer).
      if (element.text) removeElement(element.id);
      else discardNewText(element.id);
      return;
    }
    if (text !== element.text) editElement(element.id, { text });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      finish(true);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className={styles.textEditor}
      aria-label="Texto"
      value={draft}
      wrap={element.width === null ? "off" : "soft"}
      spellCheck={false}
      style={{
        ...position,
        width: element.width ?? undefined,
        padding: textPadding(element),
        font: `${element.fontWeight} ${element.fontSize}px ${getFont(element.fontId).family}`,
        lineHeight: element.lineHeight,
        textAlign: element.align,
        // Color o degradado, y la caja de fondo, también mientras se escribe.
        ...textEditorPaint(element),
        ...(element.background.isEnabled && {
          borderRadius: element.fontSize * element.background.radius,
        }),
        // Se quita el escalado del borde: siempre 1 px en pantalla.
        outlineWidth: `${1 / scale}px`,
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={onKeyDown}
    />
  );
};

/** Muestra el editor del texto que se está editando (si hay alguno). */
const TextEditorOverlay = () => {
  const element = useEditorStore((state) => {
    const found = selectElements(state).find(
      (candidate) => candidate.id === state.editingTextId
    );
    return found && isTextElement(found) ? found : null;
  });
  // key: un texto distinto empieza con su propio borrador.
  return element ? <TextEditor key={element.id} element={element} /> : null;
};

export default TextEditorOverlay;
