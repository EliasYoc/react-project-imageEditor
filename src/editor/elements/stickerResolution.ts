/**
 * Resolución con la que se pinta un sticker en el lienzo (el lado mayor de su
 * canvas, en píxeles), según el tamaño con el que se ve en pantalla.
 *
 * Pintar un vector cuesta según sus píxeles: un sticker de 512 × 512 que se
 * ve a 80 px se pinta a 128, y con muchos stickers eso se nota. Se usan
 * potencias de 2 para no cambiar de tamaño en cada paso del zoom (cada cambio
 * repinta el sticker).
 */
const MIN_RESOLUTION = 64;
/** Más grande no se nota en un teléfono y cuesta 4 veces más por cada paso. */
const MAX_RESOLUTION = 1024;

export const stickerResolution = (screenPixels: number) => {
  const power = 2 ** Math.ceil(Math.log2(Math.max(1, screenPixels)));
  return Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, power));
};
