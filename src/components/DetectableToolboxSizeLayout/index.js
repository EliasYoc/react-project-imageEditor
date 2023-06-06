import React, { useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import { selectDraggableTextFontFamily } from "../../features/paintingSlice";
import useFullSizeElement from "../../hooks/useFullSizeElement";
import { LayoutToolBox } from "../../utils/styledComponents";

const DetectableToolboxSizeLayout = ({ children, style }) => {
  const { setParentDrawinToolboxSize } = useContext(ContextToolBoxes);
  const fontFamily = useSelector(selectDraggableTextFontFamily);
  const { refElement, elementSize } = useFullSizeElement([fontFamily]);

  useEffect(() => {
    if (elementSize) {
      const { width, height } = elementSize;
      setParentDrawinToolboxSize({ width, height });
    }
    return () => {};
  }, [elementSize, setParentDrawinToolboxSize]);

  return (
    <LayoutToolBox
      ref={refElement}
      style={style}
      display="flex"
      justifyContent="space-around"
      position="relative"
      margin="0"
      gap="1.5rem"
      padding="0 1rem"
      backgroundColor="none"
    >
      {children}
    </LayoutToolBox>
  );
};

export default DetectableToolboxSizeLayout;
