/**
 * El evento ocurre mientras se escribe (un input, un textarea o un texto
 * editable). Ahí las teclas son del texto: los atajos no deben actuar.
 */
export const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
};
