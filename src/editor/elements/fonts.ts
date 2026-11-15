/**
 * Fuentes de los textos. El texto guarda el `id` (es parte del documento) y
 * la familia CSS se busca aquí al dibujar.
 *
 * Son WOFF2 propios (@fontsource), no de Google Fonts: no hay peticiones a
 * terceros y funcionan sin conexión. Cada una se carga BAJO DEMANDA con
 * `load()` (un import dinámico de su CSS): la app no descarga fuentes que no
 * se usan. Solo se baja el subconjunto latino (incluye á, é, ñ…): los demás
 * están declarados con `unicode-range` y el navegador los ignora.
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
  /** Carga los @font-face de la fuente (la del sistema no necesita). */
  load?: () => Promise<unknown>;
}

export const SYSTEM_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;

export const DEFAULT_FONT_ID: FontId = "normal";

export const FONTS: readonly FontDefinition[] = [
  { id: "normal", label: "Normal", family: SYSTEM_FONT_FAMILY },
  {
    id: "caveat",
    label: "Caveat",
    family: '"Caveat Variable", cursive',
    load: () => import("@fontsource-variable/caveat/index.css"),
  },
  {
    id: "raleway",
    label: "Raleway",
    family: '"Raleway Variable", sans-serif',
    load: () => import("@fontsource-variable/raleway/index.css"),
  },
  {
    id: "rubik",
    label: "Rubik",
    family: '"Rubik Variable", sans-serif',
    load: () => import("@fontsource-variable/rubik/index.css"),
  },
  {
    id: "cinzel",
    label: "Cinzel",
    family: '"Cinzel Variable", serif',
    load: () => import("@fontsource-variable/cinzel/index.css"),
  },
  {
    id: "comfortaa",
    label: "Comfortaa",
    family: '"Comfortaa Variable", sans-serif',
    load: () => import("@fontsource-variable/comfortaa/index.css"),
  },
  {
    id: "dancingScript",
    label: "Dancing Script",
    family: '"Dancing Script Variable", cursive',
    load: () => import("@fontsource-variable/dancing-script/index.css"),
  },
  {
    id: "sourceCodePro",
    label: "Source Code Pro",
    family: '"Source Code Pro Variable", monospace',
    load: () => import("@fontsource-variable/source-code-pro/index.css"),
  },
  {
    id: "shantellSans",
    label: "Shantell Sans",
    family: '"Shantell Sans Variable", sans-serif',
    load: () => import("@fontsource-variable/shantell-sans/index.css"),
  },
  {
    id: "lobsterTwo",
    label: "Lobster Two",
    family: '"Lobster Two", cursive',
    load: () => import("@fontsource/lobster-two/latin.css"),
  },
  {
    id: "pacifico",
    label: "Pacifico",
    family: "Pacifico, cursive",
    load: () => import("@fontsource/pacifico/latin.css"),
  },
  {
    id: "indieFlower",
    label: "Indie Flower",
    family: '"Indie Flower", cursive',
    load: () => import("@fontsource/indie-flower/latin.css"),
  },
  {
    id: "kablammo",
    label: "Kablammo",
    family: "Kablammo, fantasy",
    load: () => import("@fontsource/kablammo/latin.css"),
  },
  {
    id: "kalam",
    label: "Kalam",
    family: "Kalam, cursive",
    load: () => import("@fontsource/kalam/latin.css"),
  },
  {
    id: "permanentMarker",
    label: "Permanent Marker",
    family: '"Permanent Marker", cursive',
    load: () => import("@fontsource/permanent-marker/latin.css"),
  },
  {
    id: "pressStart2p",
    label: "Press Start 2P",
    family: '"Press Start 2P", monospace',
    load: () => import("@fontsource/press-start-2p/latin.css"),
  },
  {
    id: "specialElite",
    label: "Special Elite",
    family: '"Special Elite", monospace',
    load: () => import("@fontsource/special-elite/latin.css"),
  },
  {
    id: "hennyPenny",
    label: "Henny Penny",
    family: '"Henny Penny", fantasy',
    load: () => import("@fontsource/henny-penny/latin.css"),
  },
];

const FONTS_BY_ID = new Map(FONTS.map((font) => [font.id, font]));

/** La fuente con ese id (o la normal, si el id no existe). */
export const getFont = (id: FontId): FontDefinition =>
  FONTS_BY_ID.get(id) ?? FONTS[0];
