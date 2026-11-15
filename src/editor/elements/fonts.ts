/**
 * Fuentes de los textos. El texto guarda el `id` (es parte del documento) y
 * la familia CSS se busca aquí al dibujar.
 *
 * Las de nombre en minúsculas se declaran en src/styles/fonts.css y el resto
 * viene de Google Fonts (index.html). En la Fase 4b pasan a @fontsource.
 */
export type FontId =
  | "normal"
  | "caveat"
  | "raleway"
  | "rubik"
  | "cinzel"
  | "comfortaa"
  | "dancingScript"
  | "sourceCodePro"
  | "shantellSans"
  | "lobsterTwo"
  | "pacifico"
  | "indieFlower"
  | "kablammo"
  | "kalam"
  | "permanentMarker"
  | "pressStart2p"
  | "specialElite"
  | "hennyPenny";

export interface FontDefinition {
  id: FontId;
  /** Nombre visible en el selector. */
  label: string;
  /** Valor CSS de `font-family` (también lo usa Konva). */
  family: string;
}

export const SYSTEM_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;

export const DEFAULT_FONT_ID: FontId = "normal";

export const FONTS: readonly FontDefinition[] = [
  { id: "normal", label: "Normal", family: SYSTEM_FONT_FAMILY },
  { id: "caveat", label: "Caveat", family: "caveat" },
  { id: "raleway", label: "Raleway", family: "raleway" },
  { id: "rubik", label: "Rubik", family: "rubik" },
  { id: "cinzel", label: "Cinzel", family: "cinzel" },
  { id: "comfortaa", label: "Comfortaa", family: "comfortaa" },
  { id: "dancingScript", label: "Dancing Script", family: "dancing-script" },
  { id: "sourceCodePro", label: "Source Code Pro", family: "source-code-pro" },
  { id: "shantellSans", label: "Shantell Sans", family: "shantell-sans" },
  { id: "lobsterTwo", label: "Lobster Two", family: '"Lobster Two"' },
  { id: "pacifico", label: "Pacifico", family: "Pacifico" },
  { id: "indieFlower", label: "Indie Flower", family: '"Indie Flower"' },
  { id: "kablammo", label: "Kablammo", family: "Kablammo" },
  { id: "kalam", label: "Kalam", family: "Kalam" },
  {
    id: "permanentMarker",
    label: "Permanent Marker",
    family: '"Permanent Marker"',
  },
  { id: "pressStart2p", label: "Press Start 2P", family: '"Press Start 2P"' },
  { id: "specialElite", label: "Special Elite", family: '"Special Elite"' },
  { id: "hennyPenny", label: "Henny Penny", family: '"Henny Penny"' },
];

const FONTS_BY_ID = new Map(FONTS.map((font) => [font.id, font]));

/** La fuente con ese id (o la normal, si el id no existe). */
export const getFont = (id: FontId): FontDefinition =>
  FONTS_BY_ID.get(id) ?? FONTS[0];
