/**
 * Dibuja los textos e imágenes (que todavía son DOM con react-moveable) sobre
 * la imagen exportada, rasterizándolos con html2canvas. Se elimina en la
 * Fase 4, cuando los elementos pasen a Konva.
 *
 * html2canvas se carga solo al exportar (import dinámico): así no forma parte
 * de la carga inicial de la app.
 *
 * @param {CanvasRenderingContext2D} ctx contexto de la imagen final
 * @param {Array} elements elementos del documento
 * @param {HTMLElement} documentFrame div que ocupa el rectángulo del documento en pantalla
 */
export const drawDomElements = async (ctx, elements, documentFrame) => {
  const { default: html2canvas } = await import("html2canvas");

  // Pantalla → imagen final: basta con la posición y el tamaño del documento
  // en pantalla, sin importar la escala con que se muestre.
  const frame = documentFrame.getBoundingClientRect();
  const scaleX = ctx.canvas.width / frame.width;
  const scaleY = ctx.canvas.height / frame.height;

  // Se ordena una COPIA (de atrás hacia delante): el array viene del store.
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const element of ordered) {
    const domElement = document.getElementById(element.id);
    if (!domElement) continue;
    try {
      const rendered = await html2canvas(domElement, {
        backgroundColor: null,
        logging: false,
      });
      const rect = domElement.getBoundingClientRect();
      ctx.drawImage(
        rendered,
        (rect.left - frame.left) * scaleX,
        (rect.top - frame.top) * scaleY,
        rect.width * scaleX,
        rect.height * scaleY
      );
    } catch (error) {
      // Un elemento que falla no debe impedir exportar el resto.
      console.error(error);
    }
  }
};
