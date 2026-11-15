import type {
  ColorStop,
  Gradient,
  GradientType,
  Rgba,
} from "../../model/types";

const rgba = (r: number, g: number, b: number, a = 1): Rgba => ({ r, g, b, a });

const stops = (...colors: [Rgba, number][]): ColorStop[] =>
  colors.map(([color, offset], index) => ({
    id: `stop-${index}`,
    color,
    offset,
  }));

const gradient = (
  type: GradientType,
  angle: number,
  colorStops: ColorStop[]
): Gradient => ({
  type,
  angle,
  center: { x: 0.5, y: 0.5 },
  stops: colorStops,
});

export interface GradientPreset {
  id: string;
  label: string;
  gradient: Gradient;
}

export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  {
    id: "clasico",
    label: "Clásico",
    // El degradado por defecto de la versión anterior de la app.
    gradient: gradient(
      "linear",
      180,
      stops([rgba(52, 201, 100), 0.1], [rgba(97, 29, 173), 0.7])
    ),
  },
  {
    id: "atardecer",
    label: "Atardecer",
    gradient: gradient(
      "linear",
      135,
      stops([rgba(255, 126, 95), 0], [rgba(254, 180, 123), 1])
    ),
  },
  {
    id: "oceano",
    label: "Océano",
    gradient: gradient(
      "linear",
      180,
      stops([rgba(33, 147, 176), 0], [rgba(109, 213, 237), 1])
    ),
  },
  {
    id: "lavanda",
    label: "Lavanda",
    gradient: gradient(
      "linear",
      135,
      stops([rgba(142, 45, 226), 0], [rgba(74, 0, 224), 1])
    ),
  },
  {
    id: "menta",
    label: "Menta",
    gradient: gradient(
      "linear",
      135,
      stops([rgba(17, 153, 142), 0], [rgba(56, 239, 125), 1])
    ),
  },
  {
    id: "noche",
    label: "Noche",
    gradient: gradient(
      "linear",
      180,
      stops(
        [rgba(15, 32, 39), 0],
        [rgba(32, 58, 67), 0.5],
        [rgba(44, 83, 100), 1]
      )
    ),
  },
  {
    id: "fuego",
    label: "Fuego",
    gradient: gradient(
      "radial",
      0,
      stops([rgba(245, 175, 25), 0], [rgba(241, 39, 17), 1])
    ),
  },
  {
    id: "vineta",
    label: "Viñeta",
    // Oscurece los bordes: pensado para ponerlo sobre una foto.
    gradient: gradient(
      "radial",
      0,
      stops([rgba(0, 0, 0, 0), 0.45], [rgba(0, 0, 0, 0.75), 1])
    ),
  },
  {
    id: "arcoiris",
    label: "Arcoíris",
    gradient: gradient(
      "conic",
      0,
      stops(
        [rgba(255, 0, 0), 0],
        [rgba(255, 255, 0), 1 / 6],
        [rgba(0, 255, 0), 2 / 6],
        [rgba(0, 255, 255), 3 / 6],
        [rgba(0, 0, 255), 4 / 6],
        [rgba(255, 0, 255), 5 / 6],
        [rgba(255, 0, 0), 1]
      )
    ),
  },
  {
    id: "duotono",
    label: "Dúo",
    gradient: gradient(
      "conic",
      45,
      stops(
        [rgba(255, 94, 98), 0],
        [rgba(255, 153, 102), 0.5],
        [rgba(255, 94, 98), 1]
      )
    ),
  },
];

export const COLOR_PRESETS: readonly Rgba[] = [
  rgba(255, 255, 255),
  rgba(244, 244, 244),
  rgba(0, 0, 0),
  rgba(255, 59, 96),
  rgba(255, 204, 0),
  rgba(52, 199, 89),
  rgba(0, 122, 255),
  rgba(175, 82, 222),
];
