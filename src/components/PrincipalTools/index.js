import React, { useContext, useRef } from "react";
import { GlobalButton, LayoutToolBox } from "../../utils/styledComponents";
import { BiImageAlt, BiPalette } from "react-icons/bi";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import HeaderChildren from "../DrawingTools/components/HeaderChildren";
import {
  readFile,
  reduceAspectRatioQualityOfIncomingImage,
} from "../../utils/helper";
const PrincipalTools = () => {
  const {
    openOptionPage,
    insertElementToHeader,
    refOpenDisplayProperty,
    setCanvasSize,
    setPrincipalImageLoaded,
    setIsLoadingImage,
    setLowQualityDataImageLoaded,
    refGlobalDrawingLogs,
    setDrawingHistoryLength,
    setImageFile,
  } = useContext(ContextConfiguration);
  const refToolBox = useRef();
  const handleAddClassListFade = () => {
    refToolBox.current.classList.add("closeDown");
  };
  const handleLoadImage = async ({ target: $input }) => {
    if (!$input.files[0]) return;
    setIsLoadingImage(true);
    setImageFile($input.files[0]);

    try {
      const data = await readFile({ file: $input.files[0] });
      const $img = new Image();
      const heavyPixels = 2800;
      $img.src = data.result;

      $img.onload = () => {
        let width;
        let height;

        if ($img.width > heavyPixels || $img.height > heavyPixels) {
          const { newHeight, newWidth } =
            reduceAspectRatioQualityOfIncomingImage({
              options: $img,
              expectedMaxPixelsSize: 2048,
            });

          width = newWidth;
          height = newHeight;
        } else {
          width = $img.width;
          height = $img.height;
        }
        setCanvasSize({ width, height });

        const $newHiddenCanvas = document.createElement("canvas");
        $newHiddenCanvas.width = width;
        $newHiddenCanvas.height = height;
        const newCtx = $newHiddenCanvas.getContext("2d");
        newCtx.drawImage($img, 0, 0, width, height);
        setLowQualityDataImageLoaded($newHiddenCanvas.toDataURL("image/jpeg"));
        setIsLoadingImage(false);
        setPrincipalImageLoaded($img);
        refGlobalDrawingLogs.current = [];
        setDrawingHistoryLength(0);
      };
    } catch (error) {
      console.error(error);
      setIsLoadingImage(false);
    }
  };

  return (
    <>
      <LayoutToolBox
        className="animationAppearUp"
        gap="1rem"
        display="flex"
        justifyContent="center"
        borderRadius="50px"
        margin="10px auto"
        bottom="0"
        ref={refToolBox}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") {
            openOptionPage({ [refOpenDisplayProperty.current]: true });
          }
        }}
      >
        <GlobalButton
          onClick={() => {
            insertElementToHeader(<HeaderChildren />);
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isDrawingToolsOpen";
          }}
        >
          <BiPalette />
        </GlobalButton>
        {/* <GlobalButton
          onClick={() => {
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isCropToolsOpen";
          }}
        >
          <IoCrop />
        </GlobalButton> */}
        <label htmlFor="download-img">
          <input
            style={{ display: "none" }}
            type="file"
            id="download-img"
            accept="image/*"
            onChange={handleLoadImage}
          />
          <GlobalButton flexShrink="0">
            <BiImageAlt />
          </GlobalButton>
        </label>
      </LayoutToolBox>
    </>
  );
};

export default PrincipalTools;
