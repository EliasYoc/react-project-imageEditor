import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useFilePicker } from "./useFilePicker";

const Harness = ({ onFile }: { onFile: (file: File) => void }) => {
  const { openPicker, fileInput } = useFilePicker({
    accept: "image/*",
    onFile,
  });
  return (
    <>
      {fileInput}
      <button type="button" onClick={openPicker}>
        Elegir
      </button>
    </>
  );
};

describe("useFilePicker", () => {
  it("entrega el archivo elegido y deja volver a elegir el mismo", async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    const { container } = render(<Harness onFile={onFile} />);
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["x"], "foto.png", { type: "image/png" });

    await user.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    // El valor se vacía para que el navegador avise también al repetir archivo.
    expect(input.value).toBe("");
    expect(input.accept).toBe("image/*");
    expect(input.hidden).toBe(true);
  });

  it("el botón abre el selector del input oculto", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness onFile={vi.fn()} />);
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button", { name: "Elegir" }));
    expect(click).toHaveBeenCalledOnce();
  });
});
