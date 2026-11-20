import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectHasDocumentContent } from "../../../editor/store/selectors";
import { useUpdateStore } from "../stores/updateStore";
import { applyUpdate } from "../utils/registerUpdates";
import styles from "./UpdateButton.module.css";

/**
 * "Actualizar": solo aparece cuando hay una versión nueva que no se aplicó
 * sola (ver `registerUpdates`). Actualizar recarga la página, así que si hay
 * algo abierto se pide confirmación antes de perderlo.
 */
const UpdateButton = () => {
  const isReady = useUpdateStore((state) => state.isReady);
  const hasContent = useEditorStore(selectHasDocumentContent);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isReady) return null;

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className={styles.button}
        // El texto se oculta en pantallas muy estrechas: el nombre no.
        aria-label="Actualizar a la versión nueva"
        onClick={() => (hasContent ? setIsConfirmOpen(true) : applyUpdate())}
      >
        <RefreshCw aria-hidden="true" />
        <span className={styles.label}>Actualizar</span>
      </Button>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="¿Actualizar ahora?"
        description="Se perderá el dibujo actual. Si quieres conservarlo, expórtalo antes."
        confirmLabel="Actualizar"
        isDestructive
        onConfirm={applyUpdate}
      />
    </>
  );
};

export default UpdateButton;
