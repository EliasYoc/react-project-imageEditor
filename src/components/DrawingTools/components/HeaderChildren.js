import { useContext, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiDotsVerticalRounded, BiDownload } from "react-icons/bi";
import { MdOutlineGradient } from "react-icons/md";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import {
  GlobalButton,
  LayoutToolBox,
  ProgressBar,
} from "../../../utils/styledComponents";
import {
  deleteCanvasWithTransparency,
  getCalculatedCoordsOfContainCanvas,
  getDominantCellSizeOfContainCanvas,
  paintWholeCanvas,
  redrawGlobalDrawingLogs,
  transformElementSizeIntoCanvasElementSize,
} from "../../../utils/canvas";
import { dataUrlToBlob } from "../../../utils/helper";
import { useEffect } from "react";
import ListOptionsLayout from "../../ListOptionsLayout";
import Option from "../../ListOptionsLayout/components/Option";
import PortalNormalModal from "../../Layout/PortalNormalModal";
import PortalsSwipeableMenuLayout from "../../Layout/PortalsSwipeableMenuLayout";
import GradientBox from "../../GradientBox";
import html2canvas from "html2canvas";
import ConfirmModal from "../../ConfirmModal";
import { InputDownloadName, WarningEmptyNameField } from "../styles";

const HeaderChildren = () => {
  const {
    openOptionPage,
    ctx,
    $canvas,
    principalImageLoaded,
    refGlobalDrawingLogs,
    drawingHistoryLength,
    setDrawingHistoryLength,
    setIsLoadingImage,
    isLoadingImage,
    imageFile,
  } = useContext(ContextConfiguration);
  const { setFullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const [dataURLBlob, setDataURLBlob] = useState(null);
  const [percentDownloading, setPercentDownloading] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isOpenGradientBox, setIsOpenGradientBox] = useState(false);
  const [openDownloadNameModal, setOpenDownloadNameModal] = useState(false);
  const [downloadName, setDownloadName] = useState("");
  const [isDownloadNameEmpty, setIsDownloadNameEmpty] = useState(false);
  const anchor = useRef();

  useEffect(() => {
    async function progressDownload() {
      const eventTarget = await readImageProgressFromDataURLBlob(dataURLBlob);
      anchor.current = document.createElement("a");

      eventTarget.addEventListener("progress", function (event) {
        const percent = Math.round(event.detail.percent);
        if (event.detail.image) {
          // o tambien puedo usar la propiedad blobChunks y usar URL.createObjectURL()
          const url = event.detail.image.src;
          anchor.current.href = url;
          anchor.current.download = downloadName;
          anchor.current.click();
          anchor.current.remove();

          setTimeout(() => {
            setDataURLBlob(null);
            setPercentDownloading(0);
            URL.revokeObjectURL(url);
            window.location.reload();
          }, 400);
        }
        setPercentDownloading(percent);
      });
    }
    if (dataURLBlob) progressDownload();
  }, [dataURLBlob, downloadName]);

  const configureImageCanvasBeforeDownloading = async () => {
    setIsLoadingImage(true);
    const $canvasLayerWithImage = document.createElement("canvas");
    const $canvasLayerCopy = document.createElement("canvas");
    $canvasLayerCopy.width = $canvas.width;
    $canvasLayerCopy.height = $canvas.height;

    let layerCtxCopy = $canvasLayerCopy.getContext("2d", {
      willReadFrequently: true,
    });
    let layerCtxWithImage = $canvasLayerWithImage.getContext("2d");

    layerCtxCopy.drawImage(
      $canvas,
      0,
      0,
      principalImageLoaded ? principalImageLoaded.width : $canvas.width,
      principalImageLoaded ? principalImageLoaded.height : $canvas.height
    );
    await draggableItemIntoCanvas(layerCtxCopy);

    setTimeout(async () => {
      if (principalImageLoaded) {
        $canvasLayerWithImage.width = principalImageLoaded.width;
        $canvasLayerWithImage.height = principalImageLoaded.height;

        layerCtxWithImage.drawImage(
          principalImageLoaded,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );

        layerCtxWithImage.drawImage(
          $canvasLayerCopy,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );
      }

      let dataURL = principalImageLoaded
        ? $canvasLayerWithImage.toDataURL(
            (imageFile && imageFile.type) || "image/png"
          )
        : $canvasLayerCopy.toDataURL("image/png");
      // i need the blob in order to do the progress bar
      const dataBlob = await dataUrlToBlob(dataURL);

      setIsLoadingImage(false);
      setDataURLBlob(dataBlob);
      $canvasLayerWithImage.remove();
      $canvasLayerCopy.remove();
      URL.revokeObjectURL(dataURL);
      dataURL = null;
      layerCtxCopy = null;
      layerCtxWithImage = null;
    }, 500);
  };

  const draggableItemIntoCanvas = async (targetContext) => {
    const sortedDraggables = refGlobalDrawingLogs.current.sort((a, b) => {
      if (a.zIndex < b.zIndex) return -1;
      if (a.zIndex > b.zIndex) return 1;
      return 0;
    });

    for (const log of sortedDraggables) {
      if (
        log.whatTask === "draggableText" ||
        log.whatTask === "draggableSticker" ||
        log.whatTask === "draggableImage"
      ) {
        const $draggableElement = document.getElementById(log.id);
        let img = new Image();
        try {
          const elementCanvas = await html2canvas($draggableElement, {
            backgroundColor: null,
            removeContainer: true,
          });

          let x = log.realLeft;
          let y = log.realTop;
          let originalCanvasWidth = $canvas.getBoundingClientRect().width;
          let originalCanvasHeight = $canvas.getBoundingClientRect().height;

          const { width, height } = getDominantCellSizeOfContainCanvas(
            originalCanvasWidth,
            originalCanvasHeight,
            $canvas.height,
            $canvas.width
          );

          const { newElementWidth, newElementHeight } =
            transformElementSizeIntoCanvasElementSize(
              log.realWidth,
              log.realHeight,
              width,
              height,
              $canvas.width,
              $canvas.height
            );

          const url = elementCanvas.toDataURL("image/png");
          img.src = url;

          const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
            canvasElement: $canvas,
            canvasWidthPixel: $canvas.width,
            canvasHeightPixel: $canvas.height,
            xCoord: x,
            yCoord: y,
          });

          console.log(`real:
          imgW: ${principalImageLoaded?.width}
          imgH: ${principalImageLoaded?.height}
          cWidth:${$canvas.width}
          cHeight:${$canvas.height}
          styleW: ${width}
          styleH: ${height}
          `);

          console.log(`real:
          x:${x}
          y:${y}
          w: ${log.realWidth}
          h: ${log.realHeight}
          `);

          const msg = await imageOnLoad(img);
          console.log(`${msg}: 
                ${img}
                x: ${coordX}
                y: ${coordY}
                w: ${newElementWidth}
                h: ${newElementHeight}
              `);
          targetContext.drawImage(
            img,
            coordX,
            coordY,
            newElementWidth,
            newElementHeight
          );

          URL.revokeObjectURL(url);
          elementCanvas.remove();
          img = null;
        } catch (error) {
          alert(error);
        }
      }
    }
  };

  const imageOnLoad = (image) =>
    new Promise((resolve, reject) => {
      image.onload = () => resolve("image loaded");
      image.onerror = () => reject("error");
    });

  const readImageProgressFromDataURLBlob = async (dataURLBlob) => {
    const eventTarget = new EventTarget();
    const reader = dataURLBlob.stream().getReader();

    let downloadedBytes = 0;
    let totalBytes = dataURLBlob.size;
    let chunks = [];

    function read() {
      reader.read().then(function (result) {
        if (result.done) {
          const url = URL.createObjectURL(dataURLBlob);
          const $image = new Image();
          $image.src = url;
          $image.onload = function () {
            eventTarget.dispatchEvent(
              new CustomEvent("progress", {
                detail: {
                  percent: 100,
                  blobChunks: new Blob(chunks, { type: dataURLBlob.type }),
                  image: $image,
                },
              })
            );
            URL.revokeObjectURL(url);
          };
          return;
        }
        chunks.push(result.value);
        downloadedBytes += result.value.length;
        let percentage = totalBytes ? (downloadedBytes / totalBytes) * 100 : 0;
        eventTarget.dispatchEvent(
          new CustomEvent("progress", { detail: { percent: percentage } })
        );
        setTimeout(read, 150);
      });
    }
    read();
    return eventTarget;
  };

  const handleOpenOptions = () => setIsOptionsOpen(!isOptionsOpen);

  const handleOpenGradientBox = (isOpen) => setIsOpenGradientBox(isOpen);

  const handleClickUndo = () => {
    if (!refGlobalDrawingLogs.current.length) return;
    refGlobalDrawingLogs.current.pop();
    redrawGlobalDrawingLogs(
      principalImageLoaded,
      $canvas,
      ctx,
      refGlobalDrawingLogs
    );
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
  };

  const handleDeleteCanvas = () => {
    principalImageLoaded
      ? deleteCanvasWithTransparency({
          canvasCtx: ctx,
          canvasWidth: $canvas.width,
          canvasHeight: $canvas.height,
        })
      : paintWholeCanvas(ctx, "white", $canvas.width, $canvas.height);
    refGlobalDrawingLogs.current = [];
    setDrawingHistoryLength(0);
  };

  return (
    <>
      <ProgressBar width={`${percentDownloading}%`} />
      <div
        style={{ display: "flex", alignItems: "center", userSelect: "none" }}
      >
        {drawingHistoryLength ? (
          <GlobalButton onClick={handleClickUndo}>
            <GrUndo />
          </GlobalButton>
        ) : null}
        <span style={{ fontSize: "14px" }}>{drawingHistoryLength}</span>
      </div>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        {drawingHistoryLength ? (
          <GlobalButton
            onClick={handleDeleteCanvas}
            width="100%"
            height="auto"
            borderRadius="1rem"
            fontSize="14px"
          >
            Borrar Todo
          </GlobalButton>
        ) : null}

        {isLoadingImage ? (
          <GlobalButton
            width="auto"
            height="auto"
            borderRadius="1rem"
            fontSize="14px"
            flexShrink="0"
          >
            <span>Cargando...</span>
          </GlobalButton>
        ) : percentDownloading ? (
          <GlobalButton fontSize="14px" flexShrink="0">
            <span>{percentDownloading}%</span>
          </GlobalButton>
        ) : (
          <GlobalButton
            flexShrink="0"
            onClick={() => {
              setFullHeightSumForCanvas("0px");
              openOptionPage({ isPrincipalToolsOpen: true });
            }}
          >
            <FiX />
          </GlobalButton>
        )}

        <GlobalButton onClick={handleOpenOptions} flexShrink="0">
          <BiDotsVerticalRounded />
        </GlobalButton>
      </LayoutToolBox>
      <PortalNormalModal
        isOpen={isOptionsOpen}
        onClose={handleOpenOptions}
        zIndex="100"
      >
        <ListOptionsLayout
          background="#2e2e2ee0"
          position="absolute"
          top="60px"
          right=".5rem"
        >
          <Option
            // onClick={configureImageCanvasBeforeDownloading}
            onClick={() => setOpenDownloadNameModal(true)}
            icon={BiDownload}
            text="Descargar"
          />
          <Option
            onClick={() => handleOpenGradientBox(true)}
            icon={MdOutlineGradient}
            text="Fondos"
          />
        </ListOptionsLayout>
      </PortalNormalModal>
      <ConfirmModal
        description="Agrega un nombre a la descarga"
        isOpen={openDownloadNameModal}
        onClose={() => {
          setOpenDownloadNameModal(false);
          setIsDownloadNameEmpty(false);
        }}
        onClickConfirm={() => {
          if (!downloadName.trim()) {
            setIsDownloadNameEmpty(true);
            return;
          }
          configureImageCanvasBeforeDownloading();
          setIsDownloadNameEmpty(false);
          setOpenDownloadNameModal(false);
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
        isOpen={isOpenGradientBox}
        onClose={() => handleOpenGradientBox(false)}
      >
        <GradientBox handleOpenGradientBox={handleOpenGradientBox} />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default HeaderChildren;
