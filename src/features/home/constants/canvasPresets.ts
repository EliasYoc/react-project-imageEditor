import type { Size } from "../../../editor/model/types";
import { screenCanvasSize } from "../utils/screenCanvasSize";

export interface CanvasPreset {
  id: string;
  label: string;
  /** Una función porque "Pantalla" depende de la ventana. */
  size: () => Size;
}

export interface CanvasSection {
  id: string;
  title: string;
  /** La red a la que pertenece ("Instagram"): el lector de pantalla dice
      "Publicación de Instagram" en vez de un "Publicación" suelto. */
  network?: string;
  presets: readonly CanvasPreset[];
}

const fixed = (width: number, height: number) => () => ({ width, height });

/**
 * Las secciones de lienzos de la pantalla de inicio. Cada tamaño sale una sola
 * vez en todo el inicio (hay un test que lo vigila): por eso "Historia"
 * (1080 × 1920) solo está en "Lienzo en blanco" y sirve también para las
 * historias y el estado de WhatsApp, Instagram y Facebook; y el perfil de
 * 640 × 640 solo está en WhatsApp.
 */
export const CANVAS_SECTIONS: readonly CanvasSection[] = [
  {
    id: "blank",
    title: "Lienzo en blanco",
    presets: [
      { id: "screen", label: "Pantalla", size: screenCanvasSize },
      { id: "story", label: "Historia", size: fixed(1080, 1920) },
      { id: "landscape", label: "Horizontal", size: fixed(1920, 1080) },
    ],
  },
  {
    id: "instagram",
    title: "Instagram",
    network: "Instagram",
    presets: [
      { id: "instagram-post", label: "Publicación", size: fixed(1080, 1080) },
      { id: "instagram-portrait", label: "Vertical", size: fixed(1080, 1350) },
    ],
  },
  {
    id: "facebook",
    title: "Facebook",
    network: "Facebook",
    presets: [
      { id: "facebook-link", label: "Enlace", size: fixed(1200, 630) },
      { id: "facebook-cover", label: "Portada", size: fixed(851, 315) },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    network: "WhatsApp",
    presets: [
      { id: "whatsapp-profile", label: "Perfil", size: fixed(640, 640) },
    ],
  },
  {
    id: "telegram",
    title: "Telegram",
    network: "Telegram",
    presets: [
      { id: "telegram-sticker", label: "Sticker", size: fixed(512, 512) },
    ],
  },
  {
    id: "x",
    title: "X",
    network: "X",
    presets: [
      { id: "x-post", label: "Publicación", size: fixed(1600, 900) },
      { id: "x-header", label: "Cabecera", size: fixed(1500, 500) },
    ],
  },
  {
    id: "youtube",
    title: "YouTube",
    network: "YouTube",
    presets: [
      { id: "youtube-thumbnail", label: "Miniatura", size: fixed(1280, 720) },
      { id: "youtube-banner", label: "Banner", size: fixed(2048, 1152) },
    ],
  },
];
