import { useContext, useEffect } from "react";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import useFullSizeElement from "../../hooks/useFullSizeElement";
import { LayoutToolBox } from "../../utils/styledComponents";
const Header = ({ children }) => {
  const { handleSumHeightForCanvas } = useContext(ContextToolBoxes);
  const { elementSize, refElement } = useFullSizeElement();
  useEffect(() => {
    // terminar setchanged
    if (elementSize) {
      const { height, marginTop, marginBottom } = elementSize;
      handleSumHeightForCanvas(height, marginTop, marginBottom);
    }
  }, [elementSize, handleSumHeightForCanvas]);

  return (
    <LayoutToolBox
      ref={refElement}
      className="animationAppearDown"
      width="100%"
      position="relative"
      justifyContent="space-between"
      display="flex"
      gap="1rem"
      margin="0 0 10px"
      borderRadius="0px"
      padding="0 10px"
    >
      {children}
    </LayoutToolBox>
  );
};

export default Header;
