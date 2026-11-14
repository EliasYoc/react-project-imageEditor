import { describe, expect, it } from "vitest";
import { updateDraggableRect } from "./draggableElements";

describe("updateDraggableRect", () => {
  const moveable = {
    state: {
      target: { offsetLeft: 5, offsetTop: 6 },
      // matriz 4x4 de CSS: [0]=scaleX, [5]=scaleY, [12]=translateX, [13]=translateY
      targetMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 40, 50, 0, 1],
      targetClientRect: { width: 100, height: 60, top: 10, left: 20 },
    },
  };

  it("actualiza solo el elemento indicado y devuelve un array nuevo", () => {
    const logs = {
      current: [
        { id: "a", whatTask: "draggableText" },
        { id: "b", whatTask: "painting" },
      ],
    };

    const result = updateDraggableRect(logs, moveable, "a");

    expect(result).not.toBe(logs.current);
    expect(result[0]).toMatchObject({
      id: "a",
      translate: [40, 50],
      scale: [2, 3],
      offsetLeft: 5,
      offsetTop: 6,
      realWidth: 100,
      realHeight: 60,
      realTop: 10,
      realLeft: 20,
    });
    expect(result[1]).toBe(logs.current[1]);
  });

  it("devuelve null si Moveable no tiene un elemento seleccionado", () => {
    const logs = { current: [{ id: "a" }] };
    expect(
      updateDraggableRect(logs, { state: { target: null } }, "a")
    ).toBeNull();
  });
});
