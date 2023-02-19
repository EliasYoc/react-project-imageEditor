import { createContext, useCallback, useRef, useState } from "react";

export const initialThisDisplayOpen = {
  isPrincipalToolsOpen: false,
  isDrawingToolsOpen: false,
  isCropToolsOpen: false,
  isTextToolsOpen: false,
  isColorPickerOpen: false,
};
export const themeColor = {
  bodyColor: "#000",
  boxesColor: "#2e2e2ee0",
  activeBgColor: "#4d4c4c",
  activeTextColor: "#c4c4c4",
  textColor: "#a6a6a6bf",
};
export const ContextConfiguration = createContext();
const ConfigurationProvider = ({ children }) => {
  const [
    {
      isPrincipalToolsOpen,
      isDrawingToolsOpen,
      isTextToolsOpen,
      isCropToolsOpen,
      isColorPickerOpen,
    },
    setDisplayConfig,
  ] = useState(initialThisDisplayOpen);
  const [headerChildrenState, setHeaderChildrenState] = useState(<div></div>);
  const [canvasSize, setCanvasSize] = useState({
    width: 1080,
    height: 1920,
  });
  const [principalImageLoaded, setPrincipalImageLoaded] = useState(null);
  console.log("config provider");
  const refOpenDisplayProperty = useRef();
  const refCanvas = useRef();
  const $canvas = refCanvas.current;
  const ctx = $canvas?.getContext("2d");

  const openOptionPage = useCallback((openOption) => {
    console.log(openOption);
    setDisplayConfig({ ...initialThisDisplayOpen, ...openOption });
  }, []);
  const insertElementToHeader = (children = <div></div>) => {
    setHeaderChildrenState(children);
  };
  const data = {
    isPrincipalToolsOpen,
    isDrawingToolsOpen,
    isTextToolsOpen,
    isCropToolsOpen,
    isColorPickerOpen,
    setDisplayConfig,
    openOptionPage,
    headerChildrenState,
    insertElementToHeader,
    refOpenDisplayProperty,
    refCanvas,
    $canvas,
    canvasSize,
    setCanvasSize,
    principalImageLoaded,
    setPrincipalImageLoaded,
    ctx,
  };

  return (
    <ContextConfiguration.Provider value={data}>
      {children}
    </ContextConfiguration.Provider>
  );
};

export default ConfigurationProvider;
