import type { Rgba } from "../../../editor/model/types";

/** Alto de la vista previa del panel «Fuente y estilo», en píxeles de pantalla. */
export const PREVIEW_HEIGHT = 88;

/** Aire entre el texto y el borde de la vista previa, en píxeles de pantalla. */
export const PREVIEW_PADDING = 8;

/** Tamaño de letra con el que se ve, como mucho: un texto largo se encoge. */
export const PREVIEW_FONT_SIZE = 30;

/** Solo se muestran las primeras líneas, y cada una hasta cierto largo. */
export const PREVIEW_MAX_LINES = 3;
export const PREVIEW_MAX_LINE_LENGTH = 40;

/** Fondos de la vista previa: blanco, o gris oscuro si el texto es claro. */
export const LIGHT_BACKDROP: Rgba = { r: 255, g: 255, b: 255, a: 1 };
export const DARK_BACKDROP: Rgba = { r: 43, g: 43, b: 43, a: 1 };
