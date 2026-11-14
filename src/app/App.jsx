import "../styles/moveable.css";
import Canvas from "../features/drawing/legacy/Canvas";
import DrawingTools from "../features/drawing/DrawingTools";
import PrincipalTools from "../features/home/HomeToolbar";
import {
  ContextConfiguration,
  themeColor,
} from "../context/ConfigurationProvider";
import {
  FittedPaintWrap,
  FixedContainer,
} from "../components/ui/legacy/styledComponents";
import { useContext, useEffect } from "react";
import Header from "../components/layout/Header";
import CropTools from "../components/CropTools/index";
import LoaderSpinner from "../components/ui/LoaderSpinner";
import useFullSizeElement from "../hooks/useFullSizeElement";
import { ContextToolBoxes } from "../context/ToolBoxesProvider";
import InvisibleFrontalCanvas from "../features/drawing/legacy/DrawingOverlay";
import ToolBox from "../components/layout/ToolBox";
import DrawingNavigation from "../features/drawing/ModeSwitcher";
import EditingTools from "../features/text/TextToolbar";

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
  const { handleSumHeightForCanvas } = useContext(ContextToolBoxes);
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
    <div
      style={{ background: "linear-gradient(45deg, #111111, #1d1d1d)" }}
      className="App"
    >
      <FittedPaintWrap style={{ color: themeColor.textColor }}>
        <div ref={refHeader}>
          {isDrawingToolsOpen && <Header children={headerChildrenState} />}
        </div>
        <Canvas />
        {isPrincipalToolsOpen && <PrincipalTools />}
        <div
          ref={refFooter}
          style={{ zIndex: "100", display: "flex", flexDirection: "column" }}
        >
          {isDrawingToolsOpen && (
            <>
              <ToolBox
                // width={parentDrawinToolboxSize.width}
                // height={parentDrawinToolboxSize.height}
                display="flex"
                borderRadius="50px"
                position="relative"
                margin="10px auto 0"
                padding="0 1rem"
                gap=".5rem"
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
        <FixedContainer zIndex="1000">
          <LoaderSpinner />
        </FixedContainer>
      )}
    </div>
  );
}

export default App;
