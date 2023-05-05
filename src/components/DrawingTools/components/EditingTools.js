import React, { useContext } from "react";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { GlobalButton } from "../../../utils/styledComponents";
import DetectableToolboxSizeLayout from "../../DetectableToolboxSizeLayout";
import { v4 as uuidv4 } from "uuid";

const EditingTools = () => {
  const { refGlobalDrawingLogs, setDrawingHistoryLength } =
    useContext(ContextConfiguration);
  const handleAddText = () => {
    const newInputText = {
      id: uuidv4(),
      color: { r: 0, g: 0, b: 0, a: 1 },
      background: { r: 255, g: 255, b: 255, a: 1 },
      whatTask: "draggableText",
      size: 12,
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
    };
    refGlobalDrawingLogs.current.push(newInputText);
    console.log(refGlobalDrawingLogs);
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
  };
  return (
    <DetectableToolboxSizeLayout>
      <GlobalButton
        onClick={handleAddText}
        width="auto"
        height="auto"
        fontSize="1rem"
      >
        Add Text
      </GlobalButton>
    </DetectableToolboxSizeLayout>
  );
};

export default EditingTools;
