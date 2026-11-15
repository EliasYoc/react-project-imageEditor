/** En Mac los atajos usan ⌘; en el resto, Ctrl. */
const isApple =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export const MOD_KEY = isApple ? "⌘" : "Ctrl";

/**
 * Cómo se escriben los atajos en los tooltips (deben coincidir con
 * `getShortcutAction`).
 */
export const SHORTCUT_LABELS = {
  undo: `${MOD_KEY}+Z`,
  redo: `${MOD_KEY}+Shift+Z`,
  zoomIn: `${MOD_KEY}+=`,
  zoomOut: `${MOD_KEY}+−`,
  fit: `${MOD_KEY}+0`,
  drawBrush: "B",
  eraser: "E",
  deleteElement: "Supr",
  bold: `${MOD_KEY}+B`,
} as const;
