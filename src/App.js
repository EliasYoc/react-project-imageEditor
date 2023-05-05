import "./App.css";
import Canvas from "./components/Canvas";
import DrawingTools from "./components/DrawingTools";
import PrincipalTools from "./components/PrincipalTools";
import {
  ContextConfiguration,
  themeColor,
} from "./context/ConfigurationProvider";
import { FittedPaintWrap, FixedContainer } from "./utils/styledComponents";
import { useContext, useEffect } from "react";
import Header from "./components/Header";
import CropTools from "./components/CropTools";
import LoaderSpinner from "./components/LoaderSpinner";
import useFullSizeElement from "./hooks/useFullSizeElement";
import { ContextToolBoxes } from "./context/ToolBoxesProvider";
import InvisibleFrontalCanvas from "./components/InvisibleFrontalCanvas";
import ToolBox from "./components/ToolBox";
import DrawingNavigation from "./components/DrawingNavigation";
import EditingTools from "./components/DrawingTools/components/EditingTools";

function App() {
  const {
    isDrawingToolsOpen,
    isCropToolsOpen,
    isPrincipalToolsOpen,
    openOptionPage,
    headerChildrenState,
    isLoadingImage,
    isDrawing,
    isEditingText,
  } = useContext(ContextConfiguration);
  const { handleSumHeightForCanvas, parentDrawinToolboxSize } =
    useContext(ContextToolBoxes);
  const { refElement: refFooter, elementSize: footerSize } = useFullSizeElement(
    [isCropToolsOpen, isDrawingToolsOpen]
  );
  const { elementSize: headerSize, refElement: refHeader } = useFullSizeElement(
    [isDrawingToolsOpen]
  );

  useEffect(() => {
    if (footerSize) {
      const { height, marginTop, marginBottom } = footerSize;
      handleSumHeightForCanvas(height, marginTop, marginBottom);
    }
  }, [footerSize, handleSumHeightForCanvas]);

  console.log("APP");

  useEffect(() => {
    if (headerSize) {
      const { height, marginTop, marginBottom } = headerSize;
      handleSumHeightForCanvas(height, marginTop, marginBottom);
    }
  }, [headerSize, handleSumHeightForCanvas]);

  useEffect(() => {
    openOptionPage({ isPrincipalToolsOpen: true });
  }, [openOptionPage]);

  return (
    <div style={{ backgroundColor: themeColor.bodyColor }} className="App">
      <FittedPaintWrap style={{ color: themeColor.textColor }}>
        <div ref={refHeader}>
          {isDrawingToolsOpen && <Header children={headerChildrenState} />}
        </div>
        <Canvas />
        {isPrincipalToolsOpen && <PrincipalTools />}
        <div ref={refFooter}>
          {isDrawingToolsOpen && (
            <>
              <ToolBox
                width={parentDrawinToolboxSize.width}
                height={parentDrawinToolboxSize.height}
                display="flex"
                borderRadius="50px"
                position="relative"
                margin="10px auto 0"
                overflow="hidden"
              >
                {isDrawing && <DrawingTools />}
                {isEditingText && <EditingTools />}
              </ToolBox>
              <DrawingNavigation />
            </>
          )}
          {isCropToolsOpen && <CropTools />}
        </div>
        {isDrawingToolsOpen && (
          <InvisibleFrontalCanvas
            headerSize={headerSize}
            footerSize={footerSize}
          />
        )}
      </FittedPaintWrap>
      {isLoadingImage && (
        <FixedContainer>
          <LoaderSpinner />
        </FixedContainer>
      )}
    </div>
  );
}

export default App;
