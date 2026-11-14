import type { BrushType, Mode } from "../../editor/model/types";

export type ShortcutAction =
  | { type: "undo" }
  | { type: "redo" }
  | { type: "fit" }
  | { type: "zoomIn" }
  | { type: "zoomOut" }
  | { type: "brush"; brush: BrushType };

type KeyInfo = Pick<
  KeyboardEvent,
  "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
>;

const BRUSH_KEYS: Record<string, BrushType> = {
  b: "normal",
  s: "spray",
  e: "eraser",
};

/**
 * Qué hace una combinación de teclas en el editor (null = nada).
 *
 * - Ctrl/⌘ + Z: deshacer · Ctrl/⌘ + Shift + Z o Ctrl/⌘ + Y: rehacer
 * - Ctrl/⌘ + 0: ajustar · Ctrl/⌘ + = / −: acercar / alejar (modo Dibujar)
 * - B, S, E: pincel, spray y borrador (modo Dibujar)
 *
 * Es una función pura (sin DOM ni store) para poder probarla sin más.
 */
export const getShortcutAction = (
  { key, ctrlKey, metaKey, shiftKey, altKey }: KeyInfo,
  mode: Mode
): ShortcutAction | null => {
  if (mode === "home" || altKey) return null;
  const isDrawing = mode === "draw";
  const lowerKey = key.toLowerCase();

  if (ctrlKey || metaKey) {
    if (lowerKey === "z") return { type: shiftKey ? "redo" : "undo" };
    if (lowerKey === "y") return { type: "redo" };
    if (!isDrawing) return null;
    if (key === "0") return { type: "fit" };
    if (key === "=" || key === "+") return { type: "zoomIn" };
    if (key === "-" || key === "_") return { type: "zoomOut" };
    return null;
  }

  if (isDrawing && !shiftKey && lowerKey in BRUSH_KEYS) {
    return { type: "brush", brush: BRUSH_KEYS[lowerKey] };
  }
  return null;
};
