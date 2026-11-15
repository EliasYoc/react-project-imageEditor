import { DEFAULT_FONT_ID, getFont, type FontId } from "./fonts";

const loaded = new Set<string>();
const pending = new Map<string, Promise<boolean>>();

const fontKey = (id: FontId, weight: number) => `${id}:${weight}`;

/**
 * La fuente ya se puede usar para medir y dibujar (la del sistema siempre).
 *
 * Konva mide el texto al crearlo: si la fuente aún no se descargó, lo mide
 * con la de reserva y el texto queda mal colocado. Por eso, antes de dibujar
 * un texto, hay que esperar a `ensureFont`.
 */
export const isFontReady = (id: FontId, weight: number) =>
  id === DEFAULT_FONT_ID || loaded.has(fontKey(id, weight));

/**
 * Descarga la fuente (si hace falta) y devuelve true cuando está lista.
 * Varias llamadas a la vez comparten la misma descarga.
 */
export const ensureFont = (id: FontId, weight: number): Promise<boolean> => {
  if (isFontReady(id, weight)) return Promise.resolve(true);
  const key = fontKey(id, weight);
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const { family } = getFont(id);
  const request = document.fonts
    .load(`${weight} 64px ${family}`)
    .then((faces) => {
      // Sin caras: la fuente no está declarada (todavía). No se marca como
      // lista para volver a intentarlo la próxima vez.
      if (faces.length) loaded.add(key);
      return faces.length > 0;
    })
    .catch(() => false)
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
};

/** Solo para los tests: olvida lo cargado. */
export const resetFontLoader = () => {
  loaded.clear();
  pending.clear();
};
