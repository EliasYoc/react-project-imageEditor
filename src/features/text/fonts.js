import { DEFAULT_FONT_FAMILY } from "../../editor/model/factories";

/**
 * Fuentes disponibles para el texto. Las de minúsculas se cargan desde
 * src/styles/fonts.css; el resto desde Google Fonts (index.html).
 */
export const FONTS = [
  { id: "normal", label: "Normal", font: DEFAULT_FONT_FAMILY },
  { id: "caveat", label: "Caveat", font: "caveat" },
  { id: "raleway", label: "Raleway", font: "raleway" },
  { id: "rubik", label: "Rubik", font: "rubik" },
  { id: "cinzel", label: "Cinzel", font: "cinzel" },
  { id: "comfortaa", label: "Comfortaa", font: "comfortaa" },
  { id: "dancingScript", label: "Dancing Script", font: "dancing-script" },
  { id: "sourceCodePro", label: "Source Code Pro", font: "source-code-pro" },
  { id: "shantellSans", label: "Shantell Sans", font: "shantell-sans" },
  { id: "lobsterTwo", label: "Lobster Two", font: "Lobster Two" },
  { id: "pacifico", label: "Pacifico", font: "Pacifico" },
  { id: "indieFlower", label: "Indie Flower", font: "Indie Flower" },
  { id: "kablammo", label: "Kablammo", font: "Kablammo" },
  { id: "kalam", label: "Kalam", font: "Kalam" },
  {
    id: "permanentMarker",
    label: "Permanent Marker",
    font: "Permanent Marker",
  },
  { id: "pressStart2p", label: "Press Start 2P", font: "'Press Start 2P'" },
  { id: "specialElite", label: "Special Elite", font: "Special Elite" },
  { id: "hennyPenny", label: "Henny Penny", font: "Henny Penny" },
];
