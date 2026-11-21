import { describe, expect, it } from "vitest";
import { parseLottie } from "./lottieFile";

/** Comprime con gzip, con el `CompressionStream` del navegador (un .tgs). */
const gzip = async (bytes: Uint8Array<ArrayBuffer>) => {
  const reader = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  })
    .pipeThrough(new CompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const result = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
};

/** Un Lottie mínimo válido, con lo que se le quiera cambiar. */
const lottie = (changes: Record<string, unknown> = {}) => ({
  v: "5.7.0",
  fr: 30,
  ip: 0,
  op: 12,
  w: 64,
  h: 48,
  layers: [],
  ...changes,
});

const bytesOf = (data: unknown) =>
  new Uint8Array(new TextEncoder().encode(JSON.stringify(data)));

const gzipped = (data: unknown) => gzip(bytesOf(data));

describe("parseLottie", () => {
  it("acepta un .json de Lottie y devuelve su tamaño y su tiempo", async () => {
    const result = await parseLottie(bytesOf(lottie()));
    expect(result).toMatchObject({
      isValid: true,
      data: { w: 64, h: 48, fr: 30, ip: 0, op: 12 },
    });
  });

  it("descomprime un .tgs de Telegram (el mismo JSON con gzip)", async () => {
    const result = await parseLottie(await gzipped(lottie()));
    expect(result).toMatchObject({ isValid: true, data: { w: 64 } });
  });

  it("rechaza lo que no es un Lottie", async () => {
    const notLottie = {
      isValid: false,
      message: "Este archivo no es un sticker animado",
    };
    expect(await parseLottie(bytesOf({ nombre: "ana" }))).toEqual(notLottie);
    expect(await parseLottie(new TextEncoder().encode("no es JSON"))).toEqual(
      notLottie
    );
    expect(await parseLottie(bytesOf(lottie({ ip: 12, op: 12 })))).toEqual(
      notLottie
    );
    expect(await parseLottie(bytesOf(lottie({ w: 100_000 })))).toEqual(
      notLottie
    );
    // Empieza como un gzip pero no lo es.
    expect(await parseLottie(new Uint8Array([0x1f, 0x8b, 1, 2, 3]))).toEqual(
      notLottie
    );
  });

  it("rechaza imágenes y fuentes que no van dentro del archivo", async () => {
    const external = {
      isValid: false,
      message: "El sticker usa archivos externos y no se puede abrir",
    };
    const image = (asset: Record<string, unknown>) =>
      bytesOf(lottie({ assets: [{ id: "img", w: 10, h: 10, ...asset }] }));

    expect(
      await parseLottie(image({ u: "https://x.com/", p: "a.png" }))
    ).toEqual(external);
    expect(
      await parseLottie(image({ e: 0, p: "data:image/png;base64,AAAA" }))
    ).toEqual(external);
    expect(
      await parseLottie(
        bytesOf(
          lottie({ fonts: { list: [{ fFamily: "X", fPath: "https://x" }] } })
        )
      )
    ).toEqual(external);

    // Incrustadas, o composiciones con sus capas, sí.
    expect(
      await parseLottie(image({ e: 1, p: "data:image/png;base64,AAAA" }))
    ).toMatchObject({ isValid: true });
    expect(
      await parseLottie(bytesOf(lottie({ assets: [{ id: "c", layers: [] }] })))
    ).toMatchObject({ isValid: true });
  });

  it("corta un .tgs que al descomprimirse pasa de 20 MB", async () => {
    // 21 MB de espacios comprimen a unos pocos KB: una "bomba" pequeña.
    const bomb = await gzip(new Uint8Array(21 * 1024 * 1024).fill(32));
    expect(bomb.length).toBeLessThan(100_000);
    expect(await parseLottie(bomb)).toEqual({
      isValid: false,
      message: "El sticker es demasiado grande",
    });
  });
});
