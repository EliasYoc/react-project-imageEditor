import { isTextElement } from "../../model/types";
import { useEditorStore } from "../../store/editorStore";
import { selectElements } from "../../store/selectors";
import TextEditor from "./TextEditor";

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
