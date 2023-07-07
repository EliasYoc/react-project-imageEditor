import React, { useContext } from "react";
import { BiImages } from "react-icons/bi";
import { GlobalButton } from "../../../utils/styledComponents";
import { v4 as uuidv4 } from "uuid";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";

const IncludeImageButton = () => {
  const { refGlobalDrawingLogs, setDrawingHistoryLength } =
    useContext(ContextConfiguration);

  const addImageToCanvas = (e) => {
    console.log(e.target.files[0]);
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    const initialDraggableElement = {
      id: uuidv4(),
      whatTask: "draggableImage",
      scale: [1, 1],
      translate: [0, 0],
      left: null,
      top: null,
      realLeft: null,
      realTop: null,
      offsetLeft: null,
      offsetTop: null,
      realWidth: null,
      realHeight: null,
      initialWidth: null,
      initialHeight: null,
      imageUrl,
    };

    refGlobalDrawingLogs.current.push(initialDraggableElement);
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
  };
  return (
    <GlobalButton>
      <label htmlFor="includeImage" style={{ display: "flex" }}>
        <BiImages />
        <input
          id="includeImage"
          style={{ display: "none" }}
          type="file"
          accept="image/*"
          alt="incluir imagen"
          onChange={addImageToCanvas}
        />
      </label>
    </GlobalButton>
  );
};

export default IncludeImageButton;
