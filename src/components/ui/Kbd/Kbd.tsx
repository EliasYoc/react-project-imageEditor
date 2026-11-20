import type { ReactNode } from "react";
import styles from "./Kbd.module.css";

/** Una tecla o un atajo ("Ctrl+Z"), en el tooltip y en la lista de atajos. */
export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className={styles.kbd}>{children}</kbd>
);
