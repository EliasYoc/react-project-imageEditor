import { useId } from "react";
import styles from "./ExportDialog.module.css";

interface FileNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Extensión con la que saldrá el archivo (sin el punto); no se edita. */
  extension: string;
}

/** Campo "Nombre del archivo" de los diálogos de exportar, con su extensión. */
const FileNameField = ({ value, onChange, extension }: FileNameFieldProps) => {
  const inputId = useId();
  return (
    <>
      <label htmlFor={inputId} className={styles.label}>
        Nombre del archivo
      </label>
      <div className={styles.field}>
        <input
          id={inputId}
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
        />
        <span className={styles.extension} aria-hidden="true">
          .{extension}
        </span>
      </div>
    </>
  );
};

export default FileNameField;
