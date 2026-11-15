import { useState } from "react";
import { BiDotsVerticalRounded, BiDownload } from "react-icons/bi";
import { FiX } from "react-icons/fi";
import { GrRedo, GrUndo } from "react-icons/gr";
import { MdOutlineGradient } from "react-icons/md";
import ConfirmModal from "../../components/layout/ConfirmModal";
import Option from "../../components/layout/ListOption";
import ListOptionsLayout from "../../components/layout/ListOptionsLayout";
import PortalNormalModal from "../../components/layout/PortalNormalModal";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import { Button, IconButton } from "../../components/ui/Button";
import { LayoutToolBox } from "../../components/ui/legacy/styledComponents";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectCanRedo, selectCanUndo } from "../../editor/store/selectors";
import { exportImage } from "../export/exportImage";
import GradientBox from "../gradient/GradientBox";
import styles from "./EditorHeader.module.css";
import {
  InputDownloadName,
  WarningEmptyNameField,
} from "./EditorHeader.styles";

const EditorHeader = () => {
  const hasContent = useEditorStore((state) => state.log.length > 0);
  const historyLength = useEditorStore((state) => state.past.length);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const isExporting = useEditorStore((state) => state.status === "exporting");
  const setMode = useEditorStore((state) => state.setMode);
  const setStatus = useEditorStore((state) => state.setStatus);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const clearLog = useEditorStore((state) => state.clearLog);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isGradientBoxOpen, setIsGradientBoxOpen] = useState(false);
  const [isDownloadNameModalOpen, setIsDownloadNameModalOpen] = useState(false);
  const [downloadName, setDownloadName] = useState("");
  const [isDownloadNameEmpty, setIsDownloadNameEmpty] = useState(false);

  // Deshacer, rehacer y borrar solo cambian el store: el lienzo se pone al
  // día solo (antes había que repintar el canvas a mano después de cada uno).
  const handleExport = async () => {
    setStatus("exporting");
    try {
      await exportImage({ fileName: downloadName });
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("idle");
    }
  };

  const toggleOptions = () => setIsOptionsOpen(!isOptionsOpen);

  return (
    <>
      <div className={styles.history}>
        {/* Siempre visibles (deshabilitados si no hay nada): así los botones
            no cambian de sitio mientras se dibuja. */}
        <IconButton
          icon={GrUndo}
          aria-label="Deshacer"
          disabled={!canUndo}
          onClick={undo}
        />
        <IconButton
          icon={GrRedo}
          aria-label="Rehacer"
          disabled={!canRedo}
          onClick={redo}
        />
        <span
          className={styles.historyCount}
          title="Pasos que se pueden deshacer"
        >
          {historyLength}
        </span>
      </div>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        {hasContent && (
          <Button size="sm" onClick={clearLog}>
            Borrar todo
          </Button>
        )}

        {isExporting ? (
          <span role="status" className={styles.status}>
            Exportando…
          </span>
        ) : (
          <IconButton
            icon={FiX}
            aria-label="Cerrar el editor"
            onClick={() => setMode("home")}
          />
        )}

        <IconButton
          icon={BiDotsVerticalRounded}
          aria-label="Más opciones"
          aria-haspopup="menu"
          aria-expanded={isOptionsOpen}
          onClick={toggleOptions}
        />
      </LayoutToolBox>
      <PortalNormalModal
        isOpen={isOptionsOpen}
        onClose={toggleOptions}
        zIndex="var(--z-menu)"
      >
        <ListOptionsLayout
          background="#2e2e2ee0"
          position="absolute"
          top="60px"
          right=".5rem"
        >
          {/* Al elegir una opción se cierra el menú (antes quedaba abierto
              y el siguiente clic en la cabecera solo lo cerraba). */}
          <Option
            onClick={() => {
              setIsOptionsOpen(false);
              setIsDownloadNameModalOpen(true);
            }}
            icon={BiDownload}
            text="Descargar"
          />
          <Option
            onClick={() => {
              setIsOptionsOpen(false);
              setIsGradientBoxOpen(true);
            }}
            icon={MdOutlineGradient}
            text="Fondos"
          />
        </ListOptionsLayout>
      </PortalNormalModal>
      <ConfirmModal
        description="Agrega un nombre a la descarga"
        isOpen={isDownloadNameModalOpen}
        onClose={() => {
          setIsDownloadNameModalOpen(false);
          setIsDownloadNameEmpty(false);
        }}
        onClickConfirm={() => {
          if (!downloadName.trim()) {
            setIsDownloadNameEmpty(true);
            return;
          }
          handleExport();
          setIsDownloadNameEmpty(false);
          setIsDownloadNameModalOpen(false);
        }}
      >
        <div>
          <InputDownloadName
            type="text"
            value={downloadName}
            onChange={(e) => setDownloadName(e.target.value)}
          />
        </div>
        {isDownloadNameEmpty && (
          <WarningEmptyNameField>
            El campo no debe ir vacio
          </WarningEmptyNameField>
        )}
      </ConfirmModal>
      <PortalsSwipeableMenuLayout
        title="Crea un fondo difuminado"
        adviseText="Agrega hasta 8 thumbs para aplicar diferentes colores, presiona la línea de los multiples thumbs para agregar uno nuevo"
        isOpen={isGradientBoxOpen}
        onClose={() => setIsGradientBoxOpen(false)}
      >
        <GradientBox onApplied={() => setIsGradientBoxOpen(false)} />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default EditorHeader;
