/** Las URL blob: ya insertadas, por la huella de su contenido. */
const urlsByContent = new Map<string, string>();

/**
 * Huella del contenido del archivo (SHA-256 en hexadecimal). `crypto.subtle`
 * solo existe con HTTPS (o en localhost): sin él no hay huella (null) y cada
 * inserción lleva su propia URL.
 */
const fingerprint = async (file: Blob) => {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer()
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};

/**
 * La URL blob: con la que se inserta un archivo. Si ese mismo contenido ya
 * se insertó (aunque se vuelva a elegir en el selector), es la misma URL:
 * así los elementos con el mismo GIF o sticker comparten su animación, y 30
 * copias se pintan una sola vez por fotograma.
 *
 * `keep` la guarda para la próxima vez (al insertarlo bien); `release` la
 * suelta si al final no se insertó (solo si era nueva).
 */
export const objectUrlFor = async (file: File) => {
  const key = await fingerprint(file);
  const shared = key === null ? undefined : urlsByContent.get(key);
  if (shared) return { src: shared, keep: () => {}, release: () => {} };
  const src = URL.createObjectURL(file);
  return {
    src,
    keep: () => {
      if (key !== null) urlsByContent.set(key, src);
    },
    release: () => URL.revokeObjectURL(src),
  };
};
