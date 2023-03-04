import React, { useContext, useRef } from "react";
import {
  FixedContainer,
  GlobalButton,
  LayoutToolBox,
} from "../../utils/styledComponents";
import { IoCrop } from "react-icons/io5";
import { BiImageAlt, BiPalette } from "react-icons/bi";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import HeaderChildren from "../DrawingTools/components/HeaderChildren";
import { readFile } from "../../utils/helper";
import LoaderSpinner from "../LoaderSpinner";
const PrincipalTools = () => {
  const {
    openOptionPage,
    insertElementToHeader,
    refOpenDisplayProperty,
    setCanvasSize,
    setPrincipalImageLoaded,
    canvasSize,
    setIsAttachingImage,
    isAttachingImage,
  } = useContext(ContextConfiguration);
  const refToolBox = useRef();
  const handleAddClassListFade = () => {
    refToolBox.current.classList.add("closeDown");
  };
  const handleLoadImage = async ({ target: $input }) => {
    setIsAttachingImage(true);
    try {
      const data = await readFile({ file: $input.files[0] });
      const $img = new Image();
      $img.src = data.result;
      $img.onload = () => {
        let width;
        let height;
        if ($img.width > canvasSize.width * 2) {
          width = Math.round($img.width / 2);
          height = Math.round($img.height / 2);
        } else {
          width = $img.width;
          height = $img.height;
        }
        setCanvasSize({ width, height });
        console.log($img);
        setPrincipalImageLoaded($img);
      };
    } catch (error) {
      alert(JSON.stringify(error));
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
            console.log("transition", refOpenDisplayProperty.current);
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
        <GlobalButton
          onClick={() => {
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isCropToolsOpen";
          }}
        >
          <IoCrop />
        </GlobalButton>
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
      {isAttachingImage && (
        <FixedContainer>
          <LoaderSpinner />
        </FixedContainer>
      )}
    </>
  );
};

export default PrincipalTools;
