import { useRef, useState } from "react";
import { EditorCanvasContext } from "./editorCanvasContext";

export default function EditorCanvasProvider({ children }) {
  const mainCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  // Objeto creado una sola vez: el valor del contexto es estable.
  const [value] = useState(() => ({ mainCanvasRef, overlayCanvasRef }));

  return (
    <EditorCanvasContext.Provider value={value}>
      {children}
    </EditorCanvasContext.Provider>
  );
}
