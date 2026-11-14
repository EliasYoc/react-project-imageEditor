/**
 * Degradado lineal que cubre todo el rectángulo para cualquier ángulo.
 * Código del lienzo legacy, sin cambios: se reescribe en la Fase 5 (gradientes
 * lineales, radiales y cónicos según la especificación de CSS).
 */
export function bestFitGradient({ angle, colorList = [], w, h, ctx }) {
  var dist = Math.sqrt(w * w + h * h) / 2; // get the diagonal length

  const shortestLength = h < w ? h : w;
  var diagAngle = Math.asin(shortestLength / 2 / dist); // get the diagonal angle

  // Do the symmetry on the angle (move to first quad
  var a1 = ((angle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2);
  if (a1 > Math.PI) {
    a1 -= Math.PI;
  }
  if (a1 > Math.PI / 2 && a1 <= Math.PI) {
    a1 = Math.PI / 2 - (a1 - Math.PI / 2);
  }
  // get angles from center to edges for along and right of gradient
  var ang1 = Math.PI / 2 - diagAngle - Math.abs(a1);
  var ang2 = Math.abs(diagAngle - Math.abs(a1));

  // get distance from center to horizontal and vertical edges
  var dist1 = Math.cos(ang1) * h;
  var dist2 = Math.cos(ang2) * w;

  // get the max distance
  var scale = Math.max(dist2, dist1) / 1.7;

  // get the vector to the start and end of gradient
  var dx = Math.cos(angle) * scale;
  var dy = Math.sin(angle) * scale;

  // create the gradient
  const gradient = ctx.createLinearGradient(
    w / 2 + dx, // start pos
    h / 2 + dy,
    w / 2 - dx, // end pos
    h / 2 - dy
  );
  // add colours

  colorList.forEach(
    (color) =>
      color && gradient.addColorStop(color.opacity, color.backgroundString)
  );

  return gradient;
}
