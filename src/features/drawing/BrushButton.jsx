import { GlobalButton } from "../../components/ui/legacy/styledComponents";
import { useEditorStore } from "../../editor/store/editorStore";
import { InputTool, LabelTool } from "./BrushButton.styles";

/** Botón de radio para elegir el tipo de pincel. */
const BrushButton = ({ icon: Icon, brushType, label }) => {
  const isActive = useEditorStore((state) => state.brush.type === brushType);
  const setBrushType = useEditorStore((state) => state.setBrushType);
  const inputId = `brush-${brushType}`;

  return (
    <LabelTool htmlFor={inputId} title={label}>
      <InputTool
        type="radio"
        id={inputId}
        name="brush"
        value={brushType}
        checked={isActive}
        onChange={() => setBrushType(brushType)}
      />
      <GlobalButton>
        <Icon />
      </GlobalButton>
    </LabelTool>
  );
};

export default BrushButton;
