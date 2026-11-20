import { describe, expect, it } from "vitest";
import { fitVideoSize } from "./videoSize";

describe("fitVideoSize", () => {
  it("deja el tamaño hasta Full HD y con lados pares", () => {
    expect(fitVideoSize({ width: 1280, height: 720 })).toEqual({
      width: 1280,
      height: 720,
    });
    expect(fitVideoSize({ width: 3840, height: 2160 })).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(fitVideoSize({ width: 2160, height: 3840 })).toEqual({
      width: 1080,
      height: 1920,
    });
    expect(fitVideoSize({ width: 853, height: 481 })).toEqual({
      width: 854,
      height: 482,
    });
  });
});
