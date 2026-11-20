import { editorStore } from "../../../editor/store/editorStore";
import { selectHasDocumentContent } from "../../../editor/store/selectors";
import { updateStore } from "../stores/updateStore";

/** Cada cuánto se pregunta si hay una versión nueva con la app abierta. */
export const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Espera al volver a la app antes de recargar sola. Al volver del selector de
 * archivos, la foto elegida tarda un momento en empezar a abrirse: sin esta
 * espera, la recarga la perdería.
 */
export const SETTLE_MS = 1000;

let applyCurrentUpdate: () => void = () => {};

/** Aplica la versión nueva: recarga la página (el documento abierto se pierde). */
export const applyUpdate = () => applyCurrentUpdate();

/**
 * Recargar no pierde nada: se está en el inicio, sin documento y sin abrir una
 * foto, y con la app a la vista (no mientras se elige un archivo).
 */
const canReloadSafely = () => {
  const state = editorStore.getState();
  return (
    state.mode === "home" &&
    state.status === "idle" &&
    !selectHasDocumentContent(state) &&
    document.visibilityState === "visible" &&
    document.hasFocus()
  );
};

/**
 * Busca versiones nuevas de la app y las aplica sin tener que cerrar las
 * pestañas:
 * - si recargar no pierde nada (inicio sin documento), se aplica sola;
 * - si no, la cabecera muestra "Actualizar" y se vuelve a intentar al volver
 *   a la app o al inicio.
 *
 * El service worker nuevo espera (`registerType: "prompt"`) hasta que se le
 * pide tomar el control; entonces la página se recarga para usar la versión
 * nueva. Si otra pestaña lo activa, esta no se recarga si tiene algo abierto:
 * muestra el botón.
 *
 * Devuelve una función que lo detiene (para los tests).
 */
export function registerUpdates(reload = () => window.location.reload()) {
  let isStopped = false;
  let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
  // Esta pestaña pidió activar la versión nueva.
  let requested = false;
  // La versión nueva ya controla la página (la activó otra pestaña): basta
  // con recargar.
  let isControlled = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let checkTimer: ReturnType<typeof setInterval> | undefined;

  const apply = () => {
    if (isControlled) {
      reload();
      return;
    }
    requested = true;
    void updateSW?.();
  };

  const offer = () => {
    if (canReloadSafely()) apply();
    else updateStore.setState({ isReady: true });
  };

  const retryLater = () => {
    if (!updateStore.getState().isReady) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (canReloadSafely()) apply();
    }, SETTLE_MS);
  };

  let check = () => {};
  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") return;
    check();
    retryLater();
  };

  // virtual:pwa-register solo existe en el build (lo genera vite-plugin-pwa):
  // se importa al registrar, así lo que importa esta feature (p. ej. la
  // cabecera, en los tests) no lo necesita.
  void import("virtual:pwa-register").then(({ registerSW }) => {
    if (isStopped) return;
    updateSW = registerSW({
      onNeedRefresh: offer,
      onNeedReload() {
        if (requested) {
          reload();
          return;
        }
        isControlled = true;
        offer();
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        // El navegador solo lo comprueba al abrir la página: una pestaña que
        // sigue abierta pregunta de vez en cuando y al volver a ella.
        check = () => {
          // Si falla (red inestable, servidor caído) no hay nada que mostrar:
          // la próxima comprobación lo vuelve a intentar.
          if (navigator.onLine) registration.update().catch(() => {});
        };
        checkTimer = setInterval(check, CHECK_INTERVAL_MS);
      },
    });
  }, console.error);

  applyCurrentUpdate = apply;
  window.addEventListener("focus", retryLater);
  document.addEventListener("visibilitychange", onVisibilityChange);
  const unsubscribe = editorStore.subscribe((state, previous) => {
    if (state.mode !== previous.mode) retryLater();
  });

  return () => {
    isStopped = true;
    applyCurrentUpdate = () => {};
    clearTimeout(settleTimer);
    clearInterval(checkTimer);
    window.removeEventListener("focus", retryLater);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    unsubscribe();
  };
}
