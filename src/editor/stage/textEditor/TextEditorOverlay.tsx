import { useEditorStore } from "../../store/editorStore";
import { selectEditingText } from "../../store/selectors";
import TextEditor from "./TextEditor";

/** Muestra el editor del texto que se está editando (si hay alguno). */
const TextEditorOverlay = () => {
  const element = useEditorStore(selectEditingText);
  // key: un texto distinto empieza con su propio borrador.
  return element ? <TextEditor key={element.id} element={element} /> : null;
};

export default TextEditorOverlay;
