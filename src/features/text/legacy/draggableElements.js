// Medidas de los elementos arrastrables (texto, imágenes) para la exportación.
// Devuelven un "patch" para `updateElement` del store en lugar de modificar el
// historial en el sitio. Se reemplaza en la Fase 4 (Konva Transformer).

/** Mide un elemento recién montado (posición en pantalla y tamaño inicial). */
export const measureElement = (element) => {
  const { left, top } = element.getBoundingClientRect();
  const { width, height } = getComputedStyle(element);
  const floatWidth = parseFloat(width);
  const floatHeight = parseFloat(height);
  return {
    left,
    top,
    realLeft: left,
    realTop: top,
    offsetLeft: element.offsetLeft,
    offsetTop: element.offsetTop,
    initialWidth: floatWidth,
    realWidth: floatWidth,
    initialHeight: floatHeight,
    realHeight: floatHeight,
  };
};

/**
 * Geometría actual de un elemento arrastrable.
 *
 * El rectángulo en pantalla (lo que usa la exportación) se lee del DOM con
 * getBoundingClientRect(), que es síncrono y siempre está al día. Antes se
 * leía del estado interno de react-moveable, que se actualiza de forma
 * asíncrona y podía devolver medidas viejas (p. ej. ancho 0 en una imagen
 * recién cargada). Traslación y escala sí vienen de Moveable.
 */
export const getElementGeometry = (domElement, moveable) => {
  const { left, top, width, height } = domElement.getBoundingClientRect();
  const matrix = moveable?.state.targetMatrix;
  return {
    ...(matrix && {
      translate: [matrix[12], matrix[13]],
      scale: [matrix[0], matrix[5]],
    }),
    offsetLeft: domElement.offsetLeft,
    offsetTop: domElement.offsetTop,
    realWidth: width,
    realHeight: height,
    realTop: top,
    realLeft: left,
  };
};
