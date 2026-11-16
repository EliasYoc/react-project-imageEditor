import type { TextElement } from "../../../editor/model/types";

export const NORMAL_WEIGHT = 500;
export const BOLD_WEIGHT = 900;

export const isBold = (text: Pick<TextElement, "fontWeight">) =>
  text.fontWeight >= 700;
