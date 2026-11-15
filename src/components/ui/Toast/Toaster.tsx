import { CircleAlert, CircleCheck } from "lucide-react";
import { Toast } from "radix-ui";
import { useStore } from "zustand";
import styles from "./Toast.module.css";
import { toastStore } from "./toastStore";

/** Cuánto se ve cada aviso. */
const DURATION_MS = 4000;

/**
 * Avisos breves (Radix Toast): una píldora abajo al centro, encima de la
 * barra. Se van solos a los 4 s (el error espera más si el ratón está
 * encima), se cierran deslizándolos y el lector de pantalla los anuncia; F8
 * lleva el foco a la zona de avisos.
 */
export function Toaster() {
  const toasts = useStore(toastStore, (state) => state.toasts);
  const dismiss = useStore(toastStore, (state) => state.dismiss);

  return (
    <Toast.Provider duration={DURATION_MS} swipeDirection="down" label="Aviso">
      {toasts.map(({ id, kind, title }) => {
        const Icon = kind === "error" ? CircleAlert : CircleCheck;
        return (
          <Toast.Root
            key={id}
            className={styles.toast}
            data-kind={kind}
            // Los errores interrumpen al lector de pantalla; el resto, no.
            type={kind === "error" ? "foreground" : "background"}
            onOpenChange={(open) => !open && dismiss(id)}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <Toast.Title className={styles.title}>{title}</Toast.Title>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className={styles.viewport} label="Avisos ({hotkey})" />
    </Toast.Provider>
  );
}
