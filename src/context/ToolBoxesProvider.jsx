import { createContext, useCallback, useState } from "react";

export const ContextToolBoxes = createContext();
const ToolBoxesProvider = ({ children }) => {
  // const [toolBoxRadio, setRadioToolBoxes] = useState({});
  const [activeButtonPosition, setActiveButtonPosition] = useState({
    left: "0px",
    top: "0px",
    width: "0px",
    height: "0px",
  });
  const [fullHeightSumForCanvas, setFullHeightSumForCanvas] = useState("0px");
  // const handleChangeSelectToolButton = (e, name) => {
  //   setRadioToolBoxes({ ...toolBoxRadio, [name]: e.target.value });
  // };
  const [parentDrawinToolboxSize, setParentDrawinToolboxSize] = useState({
    width: null,
    height: null,
  });
  console.log("ToolBox provider");
  const handleSumHeightForCanvas = useCallback((...fullHeight) => {
    const fullHeightSum = fullHeight.reduce(
      (prevNum, num) => prevNum + parseFloat(num),
      0
    );
    setFullHeightSumForCanvas(
      (prev) => `${parseFloat(prev) + parseFloat(fullHeightSum)}px`
    );
  }, []);
  const handleSubstractHeightForCanvas = useCallback((...fullHeight) => {
    const fullHeightSum = fullHeight.reduce(
      (prevNum, num) => prevNum - parseFloat(num),
      0
    );
    setFullHeightSumForCanvas(
      (prev) => `${parseFloat(prev) - parseFloat(fullHeightSum)}px`
    );
  }, []);
  const data = {
    // toolBoxRadio,
    // setRadioToolBoxes,
    // handleChangeSelectToolButton,
    activeButtonPosition,
    setActiveButtonPosition,
    fullHeightSumForCanvas,
    setFullHeightSumForCanvas,
    handleSumHeightForCanvas,
    handleSubstractHeightForCanvas,
    parentDrawinToolboxSize,
    setParentDrawinToolboxSize,
  };
  return (
    <ContextToolBoxes.Provider value={data}>
      {children}
    </ContextToolBoxes.Provider>
  );
};

export default ToolBoxesProvider;
