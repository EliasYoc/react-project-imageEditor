import type { LottieTiming } from "./animationTimeline";

/*
 * Leer y comprobar un sticker Lottie (.json, o .tgs de Telegram: el mismo
 * JSON comprimido con gzip). Se hace al insertarlo, una vez: después, el
 * resto del código confía en lo que deja pasar.
 *
 * Se carga bajo demanda (con el primer sticker), como lottie-web.
 */

/** Lo que el editor usa de un archivo Lottie (lottie-web lee el resto). */
export interface LottieData extends LottieTiming {
  /** Tamaño de la animación, en píxeles. */
  w: number;
  h: number;
  layers: unknown[];
}

export type LottieFileResult =
  | { isValid: true; data: LottieData }
  /** `message` es el aviso para el usuario. */
  | { isValid: false; message: string };

const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Un .tgs pequeño podría descomprimirse en gigas (una "bomba" gzip). */
const MAX_JSON_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 4096;
const MAX_FRAME_RATE = 120;

const MESSAGES = {
  notLottie: "Este archivo no es un sticker animado",
  externalFiles: "El sticker usa archivos externos y no se puede abrir",
  tooBig: "El sticker es demasiado grande",
} as const;

const invalid = (reason: keyof typeof MESSAGES): LottieFileResult => ({
  isValid: false,
  message: MESSAGES[reason],
});

/** Los .tgs empiezan con la firma de gzip. */
const isGzip = (bytes: Uint8Array) => bytes[0] === 0x1f && bytes[1] === 0x8b;

const joinChunks = (chunks: readonly Uint8Array[], length: number) => {
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
};

/**
 * Descomprime un .tgs con el `DecompressionStream` del navegador. Se cuenta
 * lo que va saliendo y se corta al pasar de `MAX_JSON_BYTES` (null). Falla si
 * no es un gzip válido.
 */
const gunzip = async (bytes: Uint8Array<ArrayBuffer>) => {
  const reader = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  })
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return joinChunks(chunks, length);
    length += value.length;
    if (length > MAX_JSON_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumberBetween = (
  value: unknown,
  min: number,
  max: number
): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

/** Tiene lo que necesita una animación Lottie, con medidas razonables. */
const hasLottieShape = (
  data: Record<string, unknown>
): data is Record<string, unknown> & LottieData =>
  isNumberBetween(data.w, 1, MAX_SIDE) &&
  isNumberBetween(data.h, 1, MAX_SIDE) &&
  isNumberBetween(data.fr, 1, MAX_FRAME_RATE) &&
  typeof data.ip === "number" &&
  typeof data.op === "number" &&
  data.ip < data.op &&
  Array.isArray(data.layers);

/**
 * Todo lo que el archivo pide está dentro de él. lottie-web descargaría, de
 * la dirección que diga el archivo, las imágenes que no van incrustadas y las
 * fuentes con ruta (añadiendo un `<link>` o un `<style>` a la página): un
 * archivo malicioso podría cargar lo que quisiera.
 */
const usesOnlyEmbeddedFiles = (data: Record<string, unknown>) => {
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const areAssetsEmbedded = assets.every(
    (asset) =>
      // Las composiciones (con capas) van dentro; las imágenes, incrustadas.
      !isRecord(asset) ||
      typeof asset.p !== "string" ||
      Array.isArray(asset.layers) ||
      (asset.e === 1 && asset.p.startsWith("data:image/"))
  );
  const fonts =
    isRecord(data.fonts) && Array.isArray(data.fonts.list)
      ? data.fonts.list
      : [];
  const areFontsLocal = fonts.every((font) => !isRecord(font) || !font.fPath);
  return areAssetsEmbedded && areFontsLocal;
};

/** Comprueba los bytes de un .json o un .tgs y devuelve sus datos. */
export const parseLottie = async (
  bytes: Uint8Array<ArrayBuffer>
): Promise<LottieFileResult> => {
  if (bytes.length > MAX_FILE_BYTES) return invalid("tooBig");
  let json: Uint8Array = bytes;
  if (isGzip(bytes)) {
    try {
      const unzipped = await gunzip(bytes);
      if (!unzipped) return invalid("tooBig");
      json = unzipped;
    } catch {
      return invalid("notLottie");
    }
  }

  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(json));
  } catch {
    return invalid("notLottie");
  }
  if (!isRecord(data) || !hasLottieShape(data)) return invalid("notLottie");
  if (!usesOnlyEmbeddedFiles(data)) return invalid("externalFiles");
  return { isValid: true, data };
};

/** Lee y comprueba un archivo .json o .tgs. */
export const readLottieFile = async (file: Blob) =>
  parseLottie(new Uint8Array(await file.arrayBuffer()));
