import React, { useEffect, useContext } from "react";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import useFullSizeElement from "../../hooks/useFullSizeElement";
import { LayoutToolBox } from "../../utils/styledComponents";

const DetectableToolboxSizeLayout = ({ children, style }) => {
  const { setParentDrawinToolboxSize } = useContext(ContextToolBoxes);
  const { refElement, elementSize } = useFullSizeElement();
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
