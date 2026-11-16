import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/global.css";
import App from "./app/App";
import { registerUpdates } from "./features/update";

// El estado vive en el store de Zustand (src/editor/store): no necesita Provider.
const root = document.getElementById("root");
if (!root) throw new Error("Falta el elemento #root en index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// El service worker (sin conexión y actualizaciones) solo existe en el build.
if (import.meta.env.PROD) registerUpdates();
