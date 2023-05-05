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
          console.log(url);
          anchor.current.href = url;
          anchor.current.download = imageFile?.name || "IMAGE";
          anchor.current.onclick = () => console.log("click");
          anchor.current.click();
          console.dir(anchor);
          console.log("downloaded");

          setTimeout(() => {
            setDataURLBlob(null);
            setPercentDownloading(0);
          }, 400);
        }
        setPercentDownloading(percent);
      });
    }
    if (dataURLBlob) progressDownload();
  }, [dataURLBlob, imageFile?.name]);

  const configureImageCanvasBeforeDownloading = async () => {
    setIsLoadingImage(true);
    const $canvasLayerWithImage = document.createElement("canvas");
    const $canvasLayerCopy = document.createElement("canvas");
    $canvasLayerCopy.width = $canvas.width;
    $canvasLayerCopy.height = $canvas.height;

    const layerCtxCopy = $canvasLayerCopy.getContext("2d");

    layerCtxCopy.drawImage($canvas, 0, 0, $canvas.width, $canvas.height);
    await draggableItemIntoCanvas(layerCtxCopy);

    setTimeout(async () => {
      if (principalImageLoaded) {
        $canvasLayerWithImage.width = principalImageLoaded.width;
        $canvasLayerWithImage.height = principalImageLoaded.height;
        const layerCtx = $canvasLayerWithImage.getContext("2d");

        layerCtx.drawImage(
          principalImageLoaded,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );

        layerCtx.drawImage(
          $canvasLayerCopy,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );
      }

      console.log("converting to data");
      let dataURL = principalImageLoaded
        ? $canvasLayerWithImage.toDataURL(
            (imageFile && imageFile.type) || "image/png"
          )
        : $canvasLayerCopy.toDataURL("image/png");
      console.log(dataURL);
      // i need the blob in order to do the progress bar
      const dataBlob = await dataUrlToBlob(dataURL);

      setIsLoadingImage(false);
      setDataURLBlob(dataBlob);
      dataURL = null;
    }, 500);
  };

  const draggableItemIntoCanvas = async (targetContext) => {
    for (const log of refGlobalDrawingLogs.current) {
      if (
        log.whatTask === "draggableText" ||
        log.whatTask === "draggableSticker"
      ) {
        const $draggableElement = document.getElementById(log.id);
        const img = new Image();
        try {
          const canvas = await html2canvas($draggableElement, {
            backgroundColor: null,
          });
          img.src = canvas.toDataURL("image/png");
          let x = log.realLeft;
          let y = log.realTop;
          const { width, height } = getComputedStyle($canvas);
          const floatCanvasWidth = parseFloat(width.slice(0, -2));
          const floatCanvasHeight = parseFloat(height.slice(0, -2));

          const { newElementWidth, newElementHeight } =
            transformElementSizeIntoCanvasElementSize(
              log.realWidth,
              log.realHeight,
              floatCanvasWidth,
              floatCanvasHeight,
              $canvas.width,
              $canvas.height
            );

          const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
            canvasElement: $canvas,
            canvasWidthPixel: $canvas.width,
            canvasHeightPixel: $canvas.height,
            xCoord: x,
            yCoord: y,
          });

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

          // canvas.getContext("2d", { willReadFrequently: true });
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
  // example to download, it works because has content-length
  // https://fetch-progress.anthum.com/30kbps/images/sunrise-baseline.jpg

  // parseInt(res.headers.get("Content-Length"), 10);
  // console.log(blob);
  // fetch(URL.createObjectURL(blob))
  //   .then(function (res) {
  //     console.log(res.body); //readablaStream
  //     console.log(Array.from(res.headers));
  //     const reader = res.body.getReader();
  //     return new ReadableStream({
  //       start: function (controller) {
  //         console.log("controller: ", controller);
  //         function read() {
  //           reader.read(1024).then(function (result) {
  //             console.log("result: ", result);
  //             if (result.done) {
  //               controller.close();
  //               eventTarget.dispatchEvent(
  //                 new CustomEvent("progress", { detail: { percent: 100 } })
  //               );
  //               return;
  //             }
  //             downloadedBytes += result.value.length;
  //             let percentage = totalBytes
  //               ? (downloadedBytes / totalBytes) * 100
  //               : 0;
  //             console.log("progreso: ", percentage);
  //             controller.enqueue(result.value);
  //             eventTarget.dispatchEvent(
  //               new CustomEvent("progress", {
  //                 detail: { percent: percentage },
  //               })
  //             );
  //             read();
  //           });
  //         }
  //         read();
  //       },
  //     });
  //   })
  //   .then(function (stream) {
  //     const chunks = [];
  //     const reader = stream.getReader();
  //     function process() {
  //       reader.read().then(function (result) {
  //         console.log("chunks: ", chunks);
  //         if (result.done) {
  //           let blob = new Blob(chunks);
  //           let url = URL.createObjectURL(blob);
  //           const $img = new Image();
  //           $img.onload = function () {
  //             eventTarget.dispatchEvent(
  //               new CustomEvent("loaded", { detail: { img: $img } })
  //             );
  //             URL.revokeObjectURL(url);
  //           };
  //           $img.src = url;
  //           return;
  //         }
  //         chunks.push(result.value);

  //         process();
  //       });
  //     }
  //     process();
  //   });

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
            onClick={configureImageCanvasBeforeDownloading}
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
