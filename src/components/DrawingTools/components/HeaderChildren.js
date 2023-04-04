import { useContext, useState } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiDownload } from "react-icons/bi";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import {
  GlobalButton,
  LayoutToolBox,
  ProgressBar,
} from "../../../utils/styledComponents";
import {
  deleteCanvasWithTransparency,
  paintWholeCanvas,
  redrawGlobalDrawingLogs,
} from "../../../utils/canvas";
import { dataUrlToBlob } from "../../../utils/helper";
import { useEffect } from "react";

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

  useEffect(() => {
    async function progressDownload() {
      const anchor = document.createElement("a");
      const eventTarget = await readImageProgressFromDataURLBlob(dataURLBlob);

      eventTarget.addEventListener("progress", function (event) {
        const percent = Math.round(event.detail.percent);
        if (event.detail.image) {
          // o tambien puedo usar la propiedad blobChunks y usar URL.createObjectURL()
          const url = event.detail.image.src;
          anchor.href = url;
          anchor.download = imageFile?.name || "IMAGE";
          anchor.click();
          anchor.remove();
          setDataURLBlob(null);
          setTimeout(() => setPercentDownloading(0), 400);
        }
        setPercentDownloading(percent);
      });
    }
    if (dataURLBlob) progressDownload();
  }, [dataURLBlob, imageFile?.name]);

  const downloadImageCanvas = () => {
    setIsLoadingImage(true);
    setTimeout(async () => {
      const $canvasLayer = document.createElement("canvas");
      if (principalImageLoaded) {
        $canvasLayer.width = principalImageLoaded.width;
        $canvasLayer.height = principalImageLoaded.height;
        const layerCtx = $canvasLayer.getContext("2d");

        layerCtx.drawImage(
          principalImageLoaded,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );

        layerCtx.drawImage(
          $canvas,
          0,
          0,
          principalImageLoaded.width,
          principalImageLoaded.height
        );
      }
      let dataURL = principalImageLoaded
        ? $canvasLayer.toDataURL(imageFile.type)
        : $canvas.toDataURL("image/png");
      const dataBlob = await dataUrlToBlob(dataURL);

      setIsLoadingImage(false);
      setDataURLBlob(dataBlob);
      dataURL = null;
    }, 500);
  };
  // example to download, it works because has content-length
  // https://fetch-progress.anthum.com/30kbps/images/sunrise-baseline.jpg

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
          <GlobalButton onClick={downloadImageCanvas} flexShrink="0">
            <BiDownload />
          </GlobalButton>
        )}

        <GlobalButton
          flexShrink="0"
          borderRadius="1rem"
          onClick={() => {
            setFullHeightSumForCanvas("0px");
            openOptionPage({ isPrincipalToolsOpen: true });
          }}
        >
          <FiX />
        </GlobalButton>
      </LayoutToolBox>
    </>
  );
};

export default HeaderChildren;
