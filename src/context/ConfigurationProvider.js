import { createContext, useCallback, useRef, useState } from "react";

export const initialThisDisplayOpen = {
  isPrincipalToolsOpen: false,
  isDrawingToolsOpen: false,
  isCropToolsOpen: false,
  isTextToolsOpen: false,
  isColorPickerOpen: false,
  isDrawing: false,
  isEditingText: false,
};
export const themeColor = {
  bodyColor: "#000",
  boxesColor: "#2e2e2ee0",
  activeBgColor: "#4d4c4c",
  activeTextColor: "#c4c4c4",
  textColor: "#a6a6a6bf",
};
export const initialCanvasSize = {
  width: 1440,
  height: 2560,
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
      isDrawing,
      isEditingText,
    },
    setDisplayConfig,
  ] = useState(initialThisDisplayOpen);
  const [headerChildrenState, setHeaderChildrenState] = useState(<div></div>);
  const [canvasSize, setCanvasSize] = useState(initialCanvasSize);
  const [principalImageLoaded, setPrincipalImageLoaded] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [lowQualityDataImageLoaded, setLowQualityDataImageLoaded] =
    useState(null);
  const [drawingHistoryLength, setDrawingHistoryLength] = useState(0);
  const [imageFile, setImageFile] = useState(null);

  const refOpenDisplayProperty = useRef();
  const refCanvas = useRef();
  const refFrontalCanvas = useRef();
  // what tasks "painting" "adding image" "transparent eraser"
  const refGlobalDrawingLogs = useRef([]);

  const $canvas = refCanvas.current;
  const ctx = $canvas?.getContext("2d");

  const openOptionPage = useCallback((openOption) => {
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
    isDrawing,
    isEditingText,
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
    isLoadingImage,
    setIsLoadingImage,
    lowQualityDataImageLoaded,
    setLowQualityDataImageLoaded,
    refGlobalDrawingLogs,
    drawingHistoryLength,
    setDrawingHistoryLength,
    refFrontalCanvas,
    imageFile,
    setImageFile,
  };

  return (
    <ContextConfiguration.Provider value={data}>
      {children}
    </ContextConfiguration.Provider>
  );
};

export default ConfigurationProvider;
