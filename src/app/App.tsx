import { useEffect, useState } from "react";
import { Spinner } from "../components/ui/Spinner";
import { Toaster, toast } from "../components/ui/Toast";
import { TooltipProvider } from "../components/ui/Tooltip";
import { editorStore, useEditorStore } from "../editor/store/editorStore";
import { HomeScreen, usePreventFileDropNavigation } from "../features/home";
import { useKeyboardShortcuts } from "../features/shortcuts";
import styles from "./App.module.css";

const STATUS_LABELS = {
  loading: "Abriendo la imagen",
  exporting: "Exportando la imagen",
} as const;

/**
 * El editor (con Konva, la mayor parte del JavaScript) va en otro archivo: el
 * inicio no lo necesita. La promesa se reutiliza, así que precargarlo y
 * abrirlo lo descargan una sola vez.
 */
let editorModule: Promise<typeof import("./EditorShell")> | null = null;
const loadEditor = () => (editorModule ??= import("./EditorShell"));

/** Espera a que el navegador esté libre (Safari no tiene requestIdleCallback). */
const whenIdle = (callback: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1500);
  return () => clearTimeout(id);
};

type EditorShellComponent = Awaited<ReturnType<typeof loadEditor>>["default"];

/**
 * Shell de la aplicación: la pantalla de inicio y el editor.
 *
 * El inicio se pinta con lo mínimo y, en cuanto el navegador está libre, el
 * editor se descarga en segundo plano: al elegir una opción ya suele estar
 * listo. Si no lo está (red lenta), se ve "Cargando el editor" un momento.
 * Una vez abierto, el editor se queda montado (oculto en el inicio) para no
 * perder el documento ni sus rasters.
 */
function App() {
  const mode = useEditorStore((state) => state.mode);
  const status = useEditorStore((state) => state.status);
  const isEditorOpen = mode !== "home";
  const [EditorShell, setEditorShell] = useState<EditorShellComponent | null>(
    null
  );
  useKeyboardShortcuts();
  usePreventFileDropNavigation();

  useEffect(function preloadEditor() {
    let isCancelled = false;
    const cancelIdle = whenIdle(() => {
      loadEditor()
        .then((module) => !isCancelled && setEditorShell(() => module.default))
        // Si falla aquí no pasa nada: se reintenta al abrir el editor.
        .catch(() => {});
    });
    return () => {
      isCancelled = true;
      cancelIdle();
    };
  }, []);

  useEffect(
    function loadEditorOnOpen() {
      if (!isEditorOpen || EditorShell) return;
      let isCancelled = false;
      loadEditor()
        .then((module) => !isCancelled && setEditorShell(() => module.default))
        .catch((error) => {
          console.error(error);
          editorModule = null; // permite reintentar
          toast.error("No se pudo cargar el editor");
          editorStore.getState().setMode("home");
        });
      return () => {
        isCancelled = true;
      };
    },
    [isEditorOpen, EditorShell]
  );

  return (
    <TooltipProvider>
      <div className={styles.app}>
        {EditorShell && <EditorShell isOpen={isEditorOpen} />}
        {isEditorOpen && !EditorShell && <Spinner label="Cargando el editor" />}
        {!isEditorOpen && <HomeScreen />}

        {status !== "idle" && <Spinner label={STATUS_LABELS[status]} />}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
