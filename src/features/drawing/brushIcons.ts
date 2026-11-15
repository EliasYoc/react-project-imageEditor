import {
  Brush,
  Eraser,
  Highlighter,
  PenLine,
  PenTool,
  Pencil,
  SprayCan,
  createLucideIcon,
  type LucideIcon,
} from "lucide-react";
import type { BrushPresetId } from "../../editor/model/types";

/** Tiza: una barra en diagonal con polvo (lucide no tiene una). */
const Chalk = createLucideIcon("chalk", [
  [
    "path",
    {
      d: "M4.5 16.5 15 6a2.12 2.12 0 0 1 3 3L7.5 19.5a2.12 2.12 0 0 1-3-3Z",
      key: "stick",
    },
  ],
  ["path", { d: "m12 9 3 3", key: "band" }],
  ["path", { d: "M17 17h.01", key: "dust1" }],
  ["path", { d: "M20 14h.01", key: "dust2" }],
  ["path", { d: "M20 20h.01", key: "dust3" }],
]);

/** Borrador suave: el borrador de lucide con un rastro que se difumina. */
const SoftEraser = createLucideIcon("soft-eraser", [
  [
    "path",
    {
      d: "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",
      key: "body",
    },
  ],
  ["path", { d: "m5.082 11.09 8.828 8.828", key: "band" }],
  ["path", { d: "M2 21h.01", key: "trail1" }],
  ["path", { d: "M5 21h.01", key: "trail2" }],
]);

/** Icono de cada preset (lucide, con el mismo trazo que el resto). */
export const BRUSH_ICONS: Record<BrushPresetId, LucideIcon> = {
  pen: PenTool,
  marker: PenLine,
  pencil: Pencil,
  chalk: Chalk,
  airbrush: Brush,
  spray: SprayCan,
  highlighter: Highlighter,
  eraserHard: Eraser,
  eraserSoft: SoftEraser,
};
