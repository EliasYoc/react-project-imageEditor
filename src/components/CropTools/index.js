import { useContext, useRef } from "react";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import { GlobalButton, LayoutToolBox } from "../../utils/styledComponents";

const CropTools = () => {
  const { setFullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const { openOptionPage } = useContext(ContextConfiguration);
  const refOptionBox = useRef();

  return (
    <>
      <LayoutToolBox position="relative">
        <GlobalButton width="auto" height="auto">
          more options
        </GlobalButton>
      </LayoutToolBox>
      <LayoutToolBox
        display="flex"
        justifyContent="space-between"
        padding="0 .5rem"
        position="relative"
        ref={refOptionBox}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") {
            openOptionPage({ isPrincipalToolsOpen: true });
          }
        }}
      >
        <GlobalButton
          width="auto"
          height="auto"
          borderRadius="1rem"
          onClick={() => {
            refOptionBox.current.classList.add("closeDown");
            setFullHeightSumForCanvas("0px");
          }}
        >
          Cancelar
        </GlobalButton>
        <GlobalButton width="auto" height="auto" borderRadius="1rem">
          Guardar
        </GlobalButton>
      </LayoutToolBox>
    </>
  );
};

export default CropTools;
