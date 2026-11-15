import { createStore } from "zustand/vanilla";
import { createId } from "../../../lib/createId";

export type ToastKind = "success" | "error";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (kind: ToastKind, title: string) => void;
  dismiss: (id: string) => void;
}

/** Cola de avisos (fuera de React: se puede avisar desde cualquier sitio). */
export const toastStore = createStore<ToastState>()((set) => ({
  toasts: [],
  show: (kind, title) =>
    set(({ toasts }) => ({
      toasts: [...toasts, { id: createId(), kind, title }],
    })),
  dismiss: (id) =>
    set(({ toasts }) => ({
      toasts: toasts.filter((toast) => toast.id !== id),
    })),
}));

/** Avisos: `toast.success("Imagen descargada")`, `toast.error("…")`. */
export const toast = {
  success: (title: string) => toastStore.getState().show("success", title),
  error: (title: string) => toastStore.getState().show("error", title),
};
