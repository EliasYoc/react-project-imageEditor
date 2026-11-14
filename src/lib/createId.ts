/**
 * Id único para elementos del documento.
 *
 * `crypto.randomUUID()` solo existe en contextos seguros (HTTPS o localhost):
 * al probar desde el móvil por la red local (`npm run dev -- --host`, http://192.168.x.x)
 * no está disponible, así que hay una alternativa suficiente para ids locales.
 */
export const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
