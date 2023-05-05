import React, { useContext } from "react";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { GlobalButton } from "../../utils/styledComponents";
import ToolBox from "../ToolBox";

const DrawingNavigation = () => {
  const { openOptionPage } = useContext(ContextConfiguration);
  return (
    <ToolBox
      display="flex"
      justifyContent="space-around"
      borderRadius="50px"
      position="relative"
      margin="0px auto"
      gap="1rem"
      backgroundColor="none"
    >
      <GlobalButton
        onClick={() =>
          openOptionPage({
            isDrawing: true,
            isDrawingToolsOpen: true,
          })
        }
        fontSize="1rem"
        width="auto"
        height="auto"
      >
        Dibujar
      </GlobalButton>
      {/* todo: make object array that contains the editing log */}
      <GlobalButton
        onClick={() =>
          openOptionPage({
            isTextToolsOpen: true,
            isEditingText: true,
            isDrawingToolsOpen: true,
          })
        }
        fontSize="1rem"
        width="auto"
        height="auto"
      >
        Texto
      </GlobalButton>
    </ToolBox>
  );
};

export default DrawingNavigation;
