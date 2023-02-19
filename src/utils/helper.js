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
