export const debounce = (callback = () => {}, delay = 500) => {
  let idTimeout;
  return (...rest) => {
    clearTimeout(idTimeout);
    idTimeout = setTimeout(() => callback(...rest), delay);
  };
};

export const readFile = ({ file }) => {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const readable = new FileReader();
    readable.readAsDataURL(file);
    readable.addEventListener("load", (e) => {
      resolve(readable);
    });
    readable.addEventListener("error", (e) => {
      reject(readable);
    });
  });
};

export const distanceBetween = (
  coordsPoint1 = { coordX: 0, coordY: 0 },
  coordsPoint2 = { coordX: 0, coordY: 0 }
) =>
  Math.sqrt(
    Math.pow(coordsPoint2.coordX - coordsPoint1.coordX, 2) +
      Math.pow(coordsPoint2.coordY - coordsPoint1.coordY, 2)
  );

export const middlePointBetween = (p1, p2) => ({
  coordX: p1.coordX + (p2.coordX - p1.coordX) / 2,
  coordY: p1.coordY + (p2.coordY - p1.coordY) / 2,
});
