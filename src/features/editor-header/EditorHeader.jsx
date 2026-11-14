import { useState } from "react";
import { BiDotsVerticalRounded, BiDownload } from "react-icons/bi";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { MdOutlineGradient } from "react-icons/md";
import ConfirmModal from "../../components/layout/ConfirmModal";
import Option from "../../components/layout/ListOption";
import ListOptionsLayout from "../../components/layout/ListOptionsLayout";
import PortalNormalModal from "../../components/layout/PortalNormalModal";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import {
  GlobalButton,
  LayoutToolBox,
} from "../../components/ui/legacy/styledComponents";
import { useEditorCanvas } from "../../editor/canvas/editorCanvasContext";
import { redrawGlobalDrawingLogs } from "../../editor/legacy/canvasUtils";
import { editorStore, useEditorStore } from "../../editor/store/editorStore";
import { exportImage } from "../export/legacy/exportImage";
import GradientBox from "../gradient/GradientBox";
import {
  InputDownloadName,
  WarningEmptyNameField,
} from "./EditorHeader.styles";

/** Repinta el canvas principal con el historial actual del store. */
const redrawMainCanvas = (canvas) => {
  const { background, log } = editorStore.getState();
  redrawGlobalDrawingLogs(
    Boolean(background.previewUrl),
    canvas,
    canvas.getContext("2d"),
    log
  );
};

const EditorHeader = () => {
  const { mainCanvasRef } = useEditorCanvas();
  const historyLength = useEditorStore((state) => state.log.length);
  const isExporting = useEditorStore((state) => state.status === "exporting");
  const setMode = useEditorStore((state) => state.setMode);
  const setStatus = useEditorStore((state) => state.setStatus);
  const undo = useEditorStore((state) => state.undo);
  const clearLog = useEditorStore((state) => state.clearLog);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isGradientBoxOpen, setIsGradientBoxOpen] = useState(false);
  const [isDownloadNameModalOpen, setIsDownloadNameModalOpen] = useState(false);
  const [downloadName, setDownloadName] = useState("");
  const [isDownloadNameEmpty, setIsDownloadNameEmpty] = useState(false);

  const handleUndo = () => {
    undo();
    redrawMainCanvas(mainCanvasRef.current);
  };

  const handleClearAll = () => {
    clearLog();
    redrawMainCanvas(mainCanvasRef.current);
  };

  const handleExport = async () => {
    const { background, log } = editorStore.getState();
    setStatus("exporting");
    try {
      await exportImage({
        canvas: mainCanvasRef.current,
        background,
        log,
        fileName: downloadName,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("idle");
    }
  };

  const toggleOptions = () => setIsOptionsOpen(!isOptionsOpen);

  return (
    <>
      <div
        style={{ display: "flex", alignItems: "center", userSelect: "none" }}
      >
        {historyLength > 0 && (
          <GlobalButton onClick={handleUndo}>
            <GrUndo />
          </GlobalButton>
        )}
        <span style={{ fontSize: "14px" }}>{historyLength}</span>
      </div>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        {historyLength > 0 && (
          <GlobalButton
            onClick={handleClearAll}
            width="100%"
            height="auto"
            borderRadius="1rem"
            fontSize="14px"
          >
            Borrar Todo
          </GlobalButton>
        )}

        {isExporting ? (
          <GlobalButton
            width="auto"
            height="auto"
            borderRadius="1rem"
            fontSize="14px"
            flexShrink="0"
          >
            <span>Exportando…</span>
          </GlobalButton>
        ) : (
          <GlobalButton flexShrink="0" onClick={() => setMode("home")}>
            <FiX />
          </GlobalButton>
        )}

        <GlobalButton onClick={toggleOptions} flexShrink="0">
          <BiDotsVerticalRounded />
        </GlobalButton>
      </LayoutToolBox>
      <PortalNormalModal
        isOpen={isOptionsOpen}
        onClose={toggleOptions}
        zIndex="100"
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
