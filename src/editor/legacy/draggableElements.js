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
 * Lee la geometría actual que calcula react-moveable (traslación, escala y el
 * rectángulo en pantalla). Devuelve null si Moveable no tiene elemento.
 */
export const getMoveableGeometry = (moveable) => {
  const { target, targetMatrix, targetClientRect } = moveable.state;
  if (!target) return null;
  return {
    translate: [targetMatrix[12], targetMatrix[13]],
    scale: [targetMatrix[0], targetMatrix[5]],
    offsetLeft: target.offsetLeft,
    offsetTop: target.offsetTop,
    realWidth: targetClientRect.width,
    realHeight: targetClientRect.height,
    realTop: targetClientRect.top,
    realLeft: targetClientRect.left,
  };
};
