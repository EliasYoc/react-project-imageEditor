import type { Mode } from "../../editor/model/types";

export type ShortcutAction =
  | { type: "undo" }
  | { type: "redo" }
  | { type: "fit" }
  | { type: "zoomIn" }
  | { type: "zoomOut" }
  | { type: "drawBrush" }
  | { type: "eraser" }
  | { type: "brushSize"; factor: number }
  | { type: "deleteElement" }
  | { type: "toggleBold" }
  | { type: "deselect" }
  | { type: "export" }
  | { type: "showShortcuts" };

type KeyInfo = Pick<
  KeyboardEvent,
  "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
> &
  Partial<Pick<KeyboardEvent, "code">>;

/** Cuánto cambian el tamaño [ y ]. */
export const BRUSH_SIZE_STEP = 1.25;

/**
 * Qué hace una combinación de teclas en el editor (null = nada).
 *
 * - Ctrl/⌘ + Z: deshacer · Ctrl/⌘ + Shift + Z o Ctrl/⌘ + Y: rehacer
 * - Ctrl/⌘ + S: exportar · ?: lista de atajos
 * - Ctrl/⌘ + 0: ajustar · Ctrl/⌘ + = / −: acercar / alejar
 * - B / E: último pincel / último borrador (modo Dibujar)
 * - [ / ]: pincel más pequeño / más grande (modo Dibujar). Se usa la tecla
 *   física (`code`): en un teclado español los corchetes necesitan AltGr.
 * - Supr / Retroceso: eliminar el elemento seleccionado · Escape: quitar la
 *   selección · Ctrl/⌘ + B: negrita (modo Texto)
 *
 * Es una función pura (sin DOM ni store) para poder probarla sin más.
 */
export const getShortcutAction = (
  { key, code, ctrlKey, metaKey, shiftKey, altKey }: KeyInfo,
  mode: Mode
): ShortcutAction | null => {
  if (mode === "home" || altKey) return null;
  const isDrawing = mode === "draw";
  const lowerKey = key.toLowerCase();

  if (ctrlKey || metaKey) {
    if (lowerKey === "z") return { type: shiftKey ? "redo" : "undo" };
    if (lowerKey === "y") return { type: "redo" };
    if (lowerKey === "s") return { type: "export" };
    if (lowerKey === "b" && mode === "text") return { type: "toggleBold" };
    if (key === "0") return { type: "fit" };
    if (key === "=" || key === "+") return { type: "zoomIn" };
    if (key === "-" || key === "_") return { type: "zoomOut" };
    return null;
  }

  if (key === "?") return { type: "showShortcuts" };

  if (mode === "text") {
    if (key === "Delete" || key === "Backspace")
      return { type: "deleteElement" };
    if (key === "Escape") return { type: "deselect" };
    return null;
  }

  if (!isDrawing || shiftKey) return null;
  if (lowerKey === "b") return { type: "drawBrush" };
  if (lowerKey === "e") return { type: "eraser" };
  if (key === "[" || code === "BracketLeft") {
    return { type: "brushSize", factor: 1 / BRUSH_SIZE_STEP };
  }
  if (key === "]" || code === "BracketRight") {
    return { type: "brushSize", factor: BRUSH_SIZE_STEP };
  }
  return null;
};
