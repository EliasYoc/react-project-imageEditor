import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it("escribe minutos y segundos, con los segundos en dos cifras", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(7)).toBe("0:07");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(120)).toBe("2:00");
  });

  it("no cambia hasta que pasa un segundo entero", () => {
    expect(formatTime(2.999)).toBe("0:02");
    expect(formatTime(59.9)).toBe("0:59");
  });

  it("sin un tiempo válido muestra cero", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
    expect(formatTime(-3)).toBe("0:00");
  });
});
