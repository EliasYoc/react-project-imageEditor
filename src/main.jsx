import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import "./styles/fonts.css";
import App from "./app/App";
import EditorCanvasProvider from "./editor/canvas/EditorCanvasProvider";

// El estado vive en el store de Zustand (src/editor/store): no necesita Provider.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <EditorCanvasProvider>
      <App />
    </EditorCanvasProvider>
  </React.StrictMode>
);
