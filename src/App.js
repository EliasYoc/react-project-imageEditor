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

function App() {
  const {
    isDrawingToolsOpen,
    isCropToolsOpen,
    isPrincipalToolsOpen,
    openOptionPage,
    headerChildrenState,
    isLoadingImage,
  } = useContext(ContextConfiguration);
  console.log("APP");
  useEffect(() => {
    openOptionPage({ isPrincipalToolsOpen: true });
  }, [openOptionPage]);

  return (
    <div style={{ backgroundColor: themeColor.bodyColor }} className="App">
      <FittedPaintWrap style={{ color: themeColor.textColor }}>
        {isDrawingToolsOpen && <Header children={headerChildrenState} />}
        <Canvas />
        {isPrincipalToolsOpen && <PrincipalTools />}
        {isDrawingToolsOpen && <DrawingTools />}
        {isCropToolsOpen && <CropTools />}
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
