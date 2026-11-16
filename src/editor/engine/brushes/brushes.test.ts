import { describe, expect, it } from "vitest";
import type { StrokePoint } from "../../model/types";
import type { BrushStroke } from "./brushStroke";
import { createDabState, planDabs, type Dab } from "./dabEngine";
import { stampFigure } from "./dabRenderer";
import { inkOutline } from "./inkEngine";
import {
  BRUSH_PRESETS,
  BRUSH_PRESET_IDS,
  STAMP_FIGURES,
  brushEffect,
  usesStampShape,
  type DabPreset,
} from "./presets";
import { pressureFactor } from "./pressure";
import { createRandom } from "./random";
import { createSmoothPathState, smoothPath } from "./smoothPath";
import { pullRope, ropeLength, stabilizePoints } from "./stabilizer";
import { tipBucket } from "./tips";

const point = (x: number, y: number, pressure = 0.5): StrokePoint => ({
  x,
  y,
  pressure,
});

const stroke = (
  brush: BrushStroke["brush"],
  points: StrokePoint[],
  extra: Partial<BrushStroke> = {}
): BrushStroke => ({
  brush,
  color: { r: 0, g: 0, b: 0, a: 1 },
  size: 20,
  opacity: 1,
  seed: 1234,
  hasPressure: false,
  points,
  ...extra,
});

/** Un zigzag con presión variable (para probar con datos realistas). */
const zigzag = (count = 40) =>
  Array.from({ length: count }, (_, i) =>
    point(i * 7, (i % 2) * 15 + i, 0.2 + 0.6 * ((i % 5) / 4))
  );

/** Procesa los puntos en trozos de distinto tamaño, como llegan en vivo. */
const planInChunks = (s: BrushStroke, preset: DabPreset, sizes: number[]) => {
  const state = createDabState(s);
  const dabs: Dab[] = [];
  let index = 0;
  for (const size of sizes) {
    dabs.push(
      ...planDabs(s, preset, state, s.points.slice(index, index + size), false)
    );
    index += size;
  }
  dabs.push(...planDabs(s, preset, state, s.points.slice(index), true));
  return dabs;
};

describe("createRandom", () => {
  it("la misma semilla da la misma secuencia; otra semilla, otra", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const c = createRandom(43);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
    for (const value of seqA) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("pressureFactor", () => {
  const range = { min: 0.2, max: 1 };
  it("interpola entre min y max con presión real", () => {
    expect(pressureFactor(0, range, true)).toBeCloseTo(0.2);
    expect(pressureFactor(0.5, range, true)).toBeCloseTo(0.6);
    expect(pressureFactor(1, range, true)).toBeCloseTo(1);
  });
  it("sin presión real (ratón, dedo) usa el máximo", () => {
    expect(pressureFactor(0.5, range, false)).toBe(1);
  });
});

describe("estabilizador (cuerda)", () => {
  it("dentro de la cuerda el trazo no se mueve; al tensarla, la sigue", () => {
    const anchor = point(0, 0);
    expect(pullRope(anchor, point(5, 0), 10)).toBeNull();
    expect(pullRope(anchor, point(25, 0, 0.8), 10)).toEqual(point(15, 0, 0.8));
  });

  it("el primer punto se toma tal cual", () => {
    expect(pullRope(null, point(3, 4), 10)).toEqual(point(3, 4));
  });

  it("la cuerda se mide en píxeles de pantalla: con zoom es más corta en el documento", () => {
    expect(ropeLength(1, 1)).toBe(30);
    expect(ropeLength(1, 2)).toBe(15);
    expect(ropeLength(0, 1)).toBe(0);
  });

  it("suaviza el temblor: el resultado tiene menos zigzag que la entrada", () => {
    const shaky = Array.from({ length: 50 }, (_, i) =>
      point(i * 4, i % 2 ? 3 : -3)
    );
    const { points } = stabilizePoints(null, shaky, 8);
    const amplitude = Math.max(...points.slice(5).map((p) => Math.abs(p.y)));
    expect(amplitude).toBeLessThan(3);
  });

  it("por partes da lo mismo que de una vez", () => {
    const input = zigzag();
    const whole = stabilizePoints(null, input, 6).points;
    let anchor: StrokePoint | null = null;
    const parts: StrokePoint[] = [];
    for (const p of input) {
      const result = stabilizePoints(anchor, [p], 6);
      parts.push(...result.points);
      anchor = result.anchor;
    }
    expect(parts).toEqual(whole);
  });
});

describe("smoothPath", () => {
  it("empieza en el primer punto y termina en el último (con isFinal)", () => {
    const out = smoothPath(
      createSmoothPathState(),
      [point(0, 0), point(10, 0), point(20, 10)],
      true
    );
    expect(out[0]).toEqual(point(0, 0));
    expect(out.at(-1)).toEqual(point(20, 10));
  });

  it("aproxima las curvas con tramos de 2 px como mucho (el último, recto, va entero)", () => {
    const out = smoothPath(
      createSmoothPathState(),
      [point(0, 0), point(100, 0), point(100, 100)],
      true
    );
    const curve = out.slice(0, -1);
    expect(curve.length).toBeGreaterThan(40);
    for (let i = 1; i < curve.length; i++) {
      const step = Math.hypot(
        curve[i].x - curve[i - 1].x,
        curve[i].y - curve[i - 1].y
      );
      expect(step).toBeLessThanOrEqual(2.01);
    }
  });

  it("por partes da exactamente lo mismo que de una vez", () => {
    const input = zigzag();
    const whole = smoothPath(createSmoothPathState(), input, true);
    const state = createSmoothPathState();
    const parts = [
      ...smoothPath(state, input.slice(0, 3), false),
      ...smoothPath(state, input.slice(3, 17), false),
      ...smoothPath(state, input.slice(17), true),
    ];
    expect(parts).toEqual(whole);
  });
});

describe("planDabs (motor de sellos)", () => {
  const pencil = BRUSH_PRESETS.pencil as DabPreset;
  const airbrush = BRUSH_PRESETS.airbrush as DabPreset;

  it("un toque deja un sello", () => {
    const s = stroke("airbrush", [point(5, 5)]);
    const dabs = planDabs(s, airbrush, createDabState(s), s.points, true);
    expect(dabs).toHaveLength(1);
    expect(dabs[0]).toMatchObject({ x: 5, y: 5, size: 20 });
  });

  it("separa los sellos según el espaciado del preset", () => {
    // Aerógrafo: espaciado 0.08 × 20 px = 1.6 px → 100 px / 1.6 ≈ 62 sellos.
    const s = stroke("airbrush", [point(0, 0), point(100, 0)]);
    const dabs = planDabs(s, airbrush, createDabState(s), s.points, true);
    expect(dabs.length).toBeGreaterThan(60);
    expect(dabs.length).toBeLessThan(66);
  });

  it("por partes da los mismos sellos que de una vez, incluida la variación aleatoria", () => {
    const s = stroke("pencil", zigzag(), { hasPressure: true });
    const whole = planDabs(s, pencil, createDabState(s), s.points, true);
    const chunked = planInChunks(s, pencil, [1, 4, 9, 2]);
    expect(chunked).toEqual(whole);
  });

  it("la misma semilla repite el trazo; otra semilla cambia la variación", () => {
    const a = stroke("pencil", zigzag());
    const plan = (s: BrushStroke) =>
      planDabs(s, pencil, createDabState(s), s.points, true);
    expect(plan({ ...a })).toEqual(plan(a));
    expect(plan({ ...a, seed: 99 })).not.toEqual(plan(a));
  });

  it("con lápiz real, más presión = sellos más grandes y opacos", () => {
    const soft = stroke("pencil", [point(0, 0, 0.1)], { hasPressure: true });
    const hard = stroke("pencil", [point(0, 0, 1)], { hasPressure: true });
    const [dabSoft] = planDabs(
      soft,
      { ...pencil, jitter: { size: 0, angle: 0, scatter: 0, opacity: 0 } },
      createDabState(soft),
      soft.points,
      true
    );
    const [dabHard] = planDabs(
      hard,
      { ...pencil, jitter: { size: 0, angle: 0, scatter: 0, opacity: 0 } },
      createDabState(hard),
      hard.points,
      true
    );
    expect(dabHard.size).toBeGreaterThan(dabSoft.size);
    expect(dabHard.alpha).toBeGreaterThan(dabSoft.alpha);
  });
});

describe("pincel de formas", () => {
  const shapes = BRUSH_PRESETS.shapes as DabPreset;
  const line = (shape?: BrushStroke["shape"]) =>
    stroke("shapes", [point(0, 0), point(600, 0)], { shape });
  const plan = (s: BrushStroke) =>
    planDabs(s, shapes, createDabState(s), s.points, true);

  it("solo el preset de formas usa la figura del trazo", () => {
    expect(BRUSH_PRESET_IDS.filter(usesStampShape)).toEqual(["shapes"]);
  });

  it("deja las figuras separadas: cada sello queda lejos del anterior", () => {
    const dabs = plan(line());
    expect(dabs.length).toBeGreaterThan(10);
    for (let i = 1; i < dabs.length; i++) {
      const gap = Math.hypot(
        dabs[i].x - dabs[i - 1].x,
        dabs[i].y - dabs[i - 1].y
      );
      // Tamaño 20: sin separación serían una línea continua.
      expect(gap).toBeGreaterThan(20);
    }
  });

  it("estampa la figura del trazo (círculos si no tiene ninguna)", () => {
    const [dab] = plan(line("star"));
    expect(stampFigure(line("star"), dab)).toBe("star");
    expect(stampFigure(line("square"), dab)).toBe("square");
    expect(stampFigure(line(), dab)).toBe("circle");
  });

  it("la mezcla usa todas las figuras y se repite con la misma semilla", () => {
    const mix = line("mix");
    const figures = plan(mix).map((dab) => stampFigure(mix, dab));
    expect(new Set(figures)).toEqual(new Set(STAMP_FIGURES));
    expect(plan({ ...mix }).map((dab) => stampFigure(mix, dab))).toEqual(
      figures
    );
    expect(
      plan({ ...mix, seed: 99 }).map((dab) => stampFigure(mix, dab))
    ).not.toEqual(figures);
  });
});

describe("inkOutline (motor de tinta)", () => {
  const width = (outline: number[][]) => {
    const ys = outline.map(([, y]) => y);
    return Math.max(...ys) - Math.min(...ys);
  };
  const line = (pressure: number) =>
    Array.from({ length: 30 }, (_, i) => point(i * 5, 0, pressure));

  it("el Marcador tiene grosor constante (no depende de la presión)", () => {
    const light = inkOutline(
      stroke("marker", line(0.1), { hasPressure: true }),
      BRUSH_PRESETS.marker as never,
      true
    );
    const heavy = inkOutline(
      stroke("marker", line(1), { hasPressure: true }),
      BRUSH_PRESETS.marker as never,
      true
    );
    expect(width(light)).toBeCloseTo(width(heavy), 0);
    expect(width(heavy)).toBeCloseTo(20, 0);
  });

  it("la Pluma con lápiz real engrosa con la presión", () => {
    const light = inkOutline(
      stroke("pen", line(0.2), { hasPressure: true }),
      BRUSH_PRESETS.pen as never,
      true
    );
    const heavy = inkOutline(
      stroke("pen", line(1), { hasPressure: true }),
      BRUSH_PRESETS.pen as never,
      true
    );
    expect(width(heavy)).toBeGreaterThan(width(light) * 1.5);
  });

  it("un toque dibuja un punto", () => {
    expect(
      inkOutline(
        stroke("pen", [point(10, 10)]),
        BRUSH_PRESETS.pen as never,
        true
      ).length
    ).toBeGreaterThan(3);
  });
});

describe("presets", () => {
  it("todos tienen nombre, tipo y ajustes válidos", () => {
    for (const id of BRUSH_PRESET_IDS) {
      const preset = BRUSH_PRESETS[id];
      expect(preset.id).toBe(id);
      expect(preset.name).not.toBe("");
      expect(preset.defaults.size).toBeGreaterThanOrEqual(1);
      expect(preset.defaults.opacity).toBeGreaterThan(0);
      expect(preset.defaults.opacity).toBeLessThanOrEqual(1);
    }
  });

  it("los borradores borran (destination-out) y el resto pinta", () => {
    for (const id of BRUSH_PRESET_IDS) {
      const { kind, blend } = BRUSH_PRESETS[id];
      expect(blend === "destination-out").toBe(kind === "eraser");
    }
  });

  it("la Caligrafía es una punta plana, fina e inclinada, que pinta opaca", () => {
    const calligraphy = BRUSH_PRESETS.calligraphy as DabPreset;
    expect(calligraphy.tip).toMatchObject({ shape: "flat" });
    expect(
      calligraphy.tip.shape === "flat" && calligraphy.tip.ratio
    ).toBeLessThan(0.3);
    expect(calligraphy.angle).not.toBe(0);
    expect(calligraphy).toMatchObject({ blend: "source-over", flow: 1 });
    expect(calligraphy.defaults.opacity).toBe(1);
  });

  it("solo el Desenfoque aplica un efecto en vez de pintar con color", () => {
    expect(BRUSH_PRESET_IDS.filter((id) => brushEffect(id) !== null)).toEqual([
      "blur",
    ]);
    expect(brushEffect("blur")).toBe("blur");
  });
});

describe("tipBucket", () => {
  it("redondea a la potencia de 2 que cubre el tamaño (de 4 a 1024)", () => {
    expect(tipBucket(1)).toBe(4);
    expect(tipBucket(20)).toBe(32);
    expect(tipBucket(64)).toBe(64);
    expect(tipBucket(5000)).toBe(1024);
  });
});
