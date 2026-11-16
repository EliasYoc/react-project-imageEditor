import type { BrushPresetId, StampShape } from "../../model/types";
import type { PressureRange } from "./pressure";

/** Modo de fusión con el que el trazo se compone sobre la capa de pintura. */
export type BrushBlend = "source-over" | "multiply" | "destination-out";

export type BrushKind = "draw" | "eraser";

/** Ajustes que el usuario puede cambiar (cada preset recuerda los suyos). */
export interface BrushDefaults {
  /** Diámetro en píxeles del documento. */
  size: number;
  /** Opacidad del trazo completo, de 0 a 1. */
  opacity: number;
  /** Estabilización del trazo, de 0 (nada) a 1 (máxima). */
  stabilizer: number;
}

/** Forma de la punta de los pinceles de sellos. */
export type TipShape =
  /** Círculo: dureza 1 = borde nítido, 0 = muy difuminado. */
  | { shape: "round"; hardness: number }
  /** Círculo con grano: `density` es la proporción de "papel" que se pinta. */
  | { shape: "grain"; hardness: number; density: number }
  /** Rectángulo biselado (resaltador): `ratio` = alto / ancho. */
  | { shape: "flat"; ratio: number }
  /** Puntos sueltos dentro del radio (spray). */
  | { shape: "particles"; density: number; dotSize: number }
  /** Figura rellena (pincel de formas): la figura la guarda cada trazo. */
  | { shape: "stamp" };

/** Figuras que se pueden estampar ("mix" elige una de estas en cada sello). */
export type StampFigure = Exclude<StampShape, "mix">;

export const STAMP_FIGURES: readonly StampFigure[] = [
  "circle",
  "square",
  "triangle",
  "star",
];

interface BasePreset {
  id: BrushPresetId;
  name: string;
  kind: BrushKind;
  blend: BrushBlend;
  defaults: BrushDefaults;
}

/**
 * Motor de tinta (perfect-freehand): el trazo es un polígono relleno cuyo
 * grosor varía con la presión.
 */
export interface InkPreset extends BasePreset {
  engine: "ink";
  /** Cuánto adelgaza con poca presión (0 = grosor constante). */
  thinning: number;
  smoothing: number;
  streamline: number;
  /** Sin presión real, simular la presión con la velocidad. */
  simulatePressure: boolean;
  /** Longitud de la punta afilada al empezar / terminar, en tamaños de pincel. */
  taperStart: number;
  taperEnd: number;
}

/** Motor de sellos ("dabs"): se estampa la punta a lo largo del recorrido. */
export interface DabPreset extends BasePreset {
  engine: "dab";
  tip: TipShape;
  /** Distancia entre sellos, en proporción al tamaño del sello. */
  spacing: number;
  /** Cuánto deja cada sello (0–1). Los sellos se acumulan hasta 1. */
  flow: number;
  sizePressure: PressureRange;
  opacityPressure: PressureRange;
  /** Ángulo fijo de la punta, en grados. */
  angle: number;
  /** Variación aleatoria por sello (0 = ninguna). */
  jitter: {
    /** Tamaño: ± esta proporción. */
    size: number;
    /** Ángulo: ± esta proporción de media vuelta. */
    angle: number;
    /** Desplazamiento: hasta esta proporción del tamaño. */
    scatter: number;
    /** Opacidad: hasta esta proporción menos. */
    opacity: number;
  };
  /**
   * El trazo no pinta con color: su forma es la máscara de un efecto que se
   * aplica a lo que tiene debajo ("blur" = desenfocarlo).
   */
  effect?: BrushEffect;
}

export type BrushEffect = "blur";

export type BrushPreset = InkPreset | DabPreset;

const NO_JITTER = { size: 0, angle: 0, scatter: 0, opacity: 0 };
const FULL = { min: 1, max: 1 };

/**
 * Los presets son parte del documento: un trazo guarda el id de su preset y
 * se vuelve a pintar con estos parámetros. Cambiar un preset cambia cómo se
 * ven los trazos ya hechos (cuando haya autoguardado, habrá que versionarlos).
 */
export const BRUSH_PRESETS: Record<BrushPresetId, BrushPreset> = {
  pen: {
    id: "pen",
    name: "Pluma",
    kind: "draw",
    blend: "source-over",
    engine: "ink",
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.3,
    simulatePressure: true,
    taperStart: 0,
    taperEnd: 4,
    defaults: { size: 16, opacity: 1, stabilizer: 0.3 },
  },
  marker: {
    id: "marker",
    name: "Marcador",
    kind: "draw",
    blend: "source-over",
    engine: "ink",
    thinning: 0,
    smoothing: 0.5,
    streamline: 0.3,
    simulatePressure: false,
    taperStart: 0,
    taperEnd: 0,
    defaults: { size: 40, opacity: 1, stabilizer: 0.2 },
  },
  pencil: {
    id: "pencil",
    name: "Lápiz",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    tip: { shape: "grain", hardness: 0.8, density: 0.55 },
    spacing: 0.15,
    flow: 0.4,
    sizePressure: { min: 0.6, max: 1 },
    opacityPressure: { min: 0.25, max: 1 },
    angle: 0,
    jitter: { size: 0.05, angle: 1, scatter: 0, opacity: 0.1 },
    defaults: { size: 6, opacity: 0.9, stabilizer: 0.15 },
  },
  chalk: {
    id: "chalk",
    name: "Tiza",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    tip: { shape: "grain", hardness: 0.6, density: 0.4 },
    spacing: 0.12,
    flow: 0.5,
    sizePressure: { min: 0.7, max: 1 },
    opacityPressure: { min: 0.5, max: 1 },
    angle: 0,
    jitter: { size: 0.15, angle: 1, scatter: 0.08, opacity: 0.2 },
    defaults: { size: 40, opacity: 1, stabilizer: 0 },
  },
  airbrush: {
    id: "airbrush",
    name: "Aerógrafo",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    tip: { shape: "round", hardness: 0 },
    spacing: 0.08,
    flow: 0.08,
    sizePressure: { min: 0.8, max: 1 },
    opacityPressure: { min: 0.2, max: 1 },
    angle: 0,
    jitter: NO_JITTER,
    defaults: { size: 120, opacity: 0.8, stabilizer: 0.1 },
  },
  spray: {
    id: "spray",
    name: "Spray",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    tip: { shape: "particles", density: 0.6, dotSize: 0.03 },
    spacing: 0.25,
    flow: 1,
    sizePressure: { min: 0.7, max: 1 },
    opacityPressure: { min: 0.4, max: 1 },
    angle: 0,
    jitter: NO_JITTER,
    defaults: { size: 80, opacity: 1, stabilizer: 0 },
  },
  highlighter: {
    id: "highlighter",
    name: "Resaltador",
    kind: "draw",
    blend: "multiply",
    engine: "dab",
    tip: { shape: "flat", ratio: 0.3 },
    spacing: 0.05,
    flow: 1,
    sizePressure: FULL,
    opacityPressure: FULL,
    angle: -45,
    jitter: NO_JITTER,
    defaults: { size: 50, opacity: 0.5, stabilizer: 0.3 },
  },
  shapes: {
    id: "shapes",
    name: "Formas",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    tip: { shape: "stamp" },
    // Más de 1: las figuras quedan separadas, no forman una línea.
    spacing: 1.25,
    flow: 1,
    sizePressure: { min: 0.5, max: 1 },
    opacityPressure: FULL,
    angle: 0,
    jitter: { size: 0.15, angle: 0.1, scatter: 0.05, opacity: 0 },
    defaults: { size: 40, opacity: 1, stabilizer: 0.1 },
  },
  blur: {
    id: "blur",
    name: "Desenfoque",
    kind: "draw",
    blend: "source-over",
    engine: "dab",
    effect: "blur",
    // Borde suave: la zona desenfocada se funde con la nítida.
    tip: { shape: "round", hardness: 0.35 },
    spacing: 0.1,
    flow: 1,
    sizePressure: { min: 0.6, max: 1 },
    opacityPressure: FULL,
    angle: 0,
    jitter: NO_JITTER,
    // La opacidad es la intensidad: cuánto se mezcla lo desenfocado.
    defaults: { size: 90, opacity: 1, stabilizer: 0 },
  },
  eraserHard: {
    id: "eraserHard",
    name: "Borrador duro",
    kind: "eraser",
    blend: "destination-out",
    engine: "dab",
    tip: { shape: "round", hardness: 1 },
    spacing: 0.1,
    flow: 1,
    sizePressure: { min: 0.5, max: 1 },
    opacityPressure: FULL,
    angle: 0,
    jitter: NO_JITTER,
    defaults: { size: 50, opacity: 1, stabilizer: 0 },
  },
  eraserSoft: {
    id: "eraserSoft",
    name: "Borrador suave",
    kind: "eraser",
    blend: "destination-out",
    engine: "dab",
    tip: { shape: "round", hardness: 0.2 },
    spacing: 0.08,
    flow: 0.25,
    sizePressure: { min: 0.8, max: 1 },
    opacityPressure: { min: 0.3, max: 1 },
    angle: 0,
    jitter: NO_JITTER,
    defaults: { size: 100, opacity: 1, stabilizer: 0 },
  },
};

export const BRUSH_PRESET_IDS = Object.keys(BRUSH_PRESETS) as BrushPresetId[];

export const getBrushPreset = (id: BrushPresetId): BrushPreset =>
  BRUSH_PRESETS[id];

/** Efecto que aplica el preset en lugar de pintar (null = pinta con color). */
export const brushEffect = (id: BrushPresetId): BrushEffect | null => {
  const preset = BRUSH_PRESETS[id];
  return (preset.engine === "dab" && preset.effect) || null;
};

/** El preset estampa la figura elegida por el usuario (pincel de formas). */
export const usesStampShape = (id: BrushPresetId) => {
  const preset = BRUSH_PRESETS[id];
  return preset.engine === "dab" && preset.tip.shape === "stamp";
};
