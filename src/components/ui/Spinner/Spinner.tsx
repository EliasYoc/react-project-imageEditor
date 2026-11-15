import styles from "./Spinner.module.css";

/**
 * Indicador de carga a pantalla completa (anunciado a lectores de pantalla).
 * Bloquea la interacción mientras se abre o se exporta una imagen.
 */
export function Spinner({ label = "Cargando" }: { label?: string }) {
  return (
    <div className={styles.overlay}>
      <span className={styles.spinner} role="status" aria-label={label} />
    </div>
  );
}
