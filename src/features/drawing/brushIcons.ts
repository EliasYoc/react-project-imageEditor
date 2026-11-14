import type { IconType } from "react-icons";
import { BiChalkboard, BiHighlight, BiSprayCan } from "react-icons/bi";
import { BsBrush, BsEraser, BsEraserFill } from "react-icons/bs";
import { RiMarkPenLine, RiPenNibLine, RiPencilLine } from "react-icons/ri";
import type { BrushPresetId } from "../../editor/model/types";

/** Icono de cada preset (se cambian por lucide-react en la Fase 6). */
export const BRUSH_ICONS: Record<BrushPresetId, IconType> = {
  pen: RiPenNibLine,
  marker: RiMarkPenLine,
  pencil: RiPencilLine,
  chalk: BiChalkboard,
  airbrush: BsBrush,
  spray: BiSprayCan,
  highlighter: BiHighlight,
  eraserHard: BsEraserFill,
  eraserSoft: BsEraser,
};
