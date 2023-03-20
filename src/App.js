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

function App() {
  const {
    isDrawingToolsOpen,
    isCropToolsOpen,
    isPrincipalToolsOpen,
    openOptionPage,
    headerChildrenState,
    isLoadingImage,
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
          {isDrawingToolsOpen && <DrawingTools />}
          {isCropToolsOpen && <CropTools />}
        </div>
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
