import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { getFont } from "../../elements/fonts";
import { textPadding } from "../../elements/nodeConfig";
import { newTextPosition, type EditingBox } from "../../elements/textEditorBox";
import { elementPose } from "../../elements/textEditorMotion";
import { textEditorPaint } from "../../elements/textGradient";
import type { TextElement } from "../../model/types";
import { editorStore } from "../../store/editorStore";
import { selectEditingText } from "../../store/selectors";
import { useMaxTextWidth } from "../elementHooks";
import { useViewStore } from "../viewStore";
import { editingBackdropColor } from "./editingBackdrop";
import styles from "./TextEditor.module.css";
import { useEditingBox } from "./useEditingBox";
import { useEditorMotion } from "./useEditorMotion";
import { useFitTextarea } from "./useFitTextarea";

/**
 * Textarea para escribir un texto, con la misma fuente, color y forma que el
 * nodo de Konva. Mientras se edita, el nodo se oculta y el textarea no se
 * pone encima: sale horizontal, centrado y un poco arriba, y al tamaño de un
 * texto nuevo (`useEditingBox`), para leerlo aunque el texto esté girado,
 * lejos, o sea muy grande o muy pequeño. En el móvil no queda debajo del
 * teclado. Al terminar, el texto sigue donde estaba y con su tamaño; uno
 * recién escrito se queda donde estaba el editor.
 *
 * Una capa tapa el lienzo mientras se escribe. Se confirma al salir (tocar
 * fuera o la capa) o con Ctrl/⌘ + Enter; Escape cancela. Un texto nuevo que
 * se deja vacío se descarta sin dejar rastro.
 *
 * Al volver a editar un texto, el editor sale de donde está en el lienzo; al
 * terminar, vuelve a él (`useEditorMotion`). Mientras vuelve, el texto ya
 * está guardado y la edición no termina hasta que llega: el texto del lienzo
 * sigue oculto y el editor ya no responde.
 */
const TextEditor = ({ element }: { element: TextElement }) => {
  const view = useViewStore((state) => state.view);
  const maxWidth = useMaxTextWidth();
  // Un texto nuevo se crea vacío: ese es el único momento en que lo está
  // (al guardarlo, mientras el editor vuelve al lienzo, ya no lo está).
  const [isNewText] = useState(element.text === "");
  const [draft, setDraft] = useState(element.text);
  const padding = textPadding(element);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef(false);
  // Al terminar, el editor vuelve al lienzo desde donde estaba: aunque se
  // cierre el teclado y cambie la zona libre, ya no se mueve.
  const [closingBox, setClosingBox] = useState<EditingBox | null>(null);
  const isClosing = closingBox !== null;

  const contentSize = useFitTextarea(textareaRef, {
    draft,
    fixedWidth: element.width,
    fontSize: element.fontSize,
    padding,
    maxWidth,
  });
  const liveBox = useEditingBox(textareaRef, element, contentSize);
  const box = closingBox ?? liveBox;
  const { scale, maxHeight, ...position } = box;
  const { leaveTo } = useEditorMotion({
    textareaRef,
    backdropRef,
    placement: box,
    contentWidth: contentSize.width,
    enterFrom: isNewText ? null : elementPose(element, view),
  });

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
    function keepCaretInView() {
      const textarea = textareaRef.current;
      if (!textarea || maxHeight === undefined) return;
      // Con el texto desplazándose dentro del editor, la línea donde se
      // escribe (al final) tiene que verse, también al abrirse el teclado.
      if (textarea.selectionEnd === textarea.value.length) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    },
    [maxHeight, draft]
  );

  const finish = (save: boolean) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    const { editElement, removeElement, discardNewText, stopTextEditing } =
      editorStore.getState();
    const text = save ? draft : element.text;
    if (!text.trim()) {
      // Vacío: un texto nuevo desaparece; uno que ya existía se elimina
      // (se puede deshacer). Sin transición: no queda nada a lo que volver.
      stopTextEditing();
      if (isNewText) discardNewText(element.id);
      else removeElement(element.id);
      return;
    }
    if (text !== element.text) {
      // Un texto nuevo se queda donde estaba el editor, no donde se creó; en
      // el mismo cambio, así que no añade un paso al historial.
      editElement(
        element.id,
        isNewText
          ? {
              text,
              ...newTextPosition(
                position,
                contentSize.width,
                element.scale,
                view
              ),
            }
          : { text }
      );
    }
    returnToCanvas();
  };

  /** Vuelve al texto (ya guardado) en el lienzo y, al llegar, termina la edición. */
  const returnToCanvas = () => {
    const saved = selectEditingText(editorStore.getState()) ?? element;
    setClosingBox(box);
    leaveTo(elementPose(saved, view), () => {
      // Si mientras tanto se empezó a editar otro texto, esa edición sigue.
      const { editingTextId, stopTextEditing } = editorStore.getState();
      if (editingTextId === element.id) stopTextEditing();
    });
  };

  // Tocar la capa confirma el texto (el textarea pierde el foco al apretar)
  // y quita la selección, como tocar el fondo. Salvo el segundo clic de un
  // doble clic: sobre un texto ya seleccionado, el primero abre el editor y
  // el segundo cae aquí; evitar que se pierda el foco lo deja abierto.
  const onBackdropMouseDown = (event: MouseEvent) => {
    if (event.detail >= 2) {
      event.preventDefault();
      return;
    }
    editorStore.getState().selectElement(null);
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
    <>
      <div
        ref={backdropRef}
        className={styles.backdrop}
        data-closing={isClosing || undefined}
        style={{ backgroundColor: editingBackdropColor(element) }}
        onMouseDown={onBackdropMouseDown}
      />
      <textarea
        ref={textareaRef}
        className={styles.editor}
        data-closing={isClosing || undefined}
        aria-label="Texto"
        value={draft}
        readOnly={isClosing}
        wrap={element.width === null ? "off" : "soft"}
        spellCheck={false}
        style={{
          ...position,
          maxHeight,
          // Solo si no cabe: el resto se desplaza dentro del editor.
          overflowY: maxHeight === undefined ? undefined : "auto",
          width: element.width ?? undefined,
          padding,
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
    </>
  );
};

export default TextEditor;
