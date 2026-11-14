import { BiBold } from "react-icons/bi";
import { GlobalButton } from "../../components/ui/legacy/styledComponents";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectSelectedText } from "../../editor/store/selectors";

const BOLD_WEIGHT = 900;
const NORMAL_WEIGHT = 500;

const BoldButton = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const updateElement = useEditorStore((state) => state.updateElement);

  const isDisabled = selectedText === null;
  // Checkbox controlado: refleja siempre el texto seleccionado.
  const isBold = !isDisabled && selectedText.fontWeight >= 700;

  const handleChange = (e) => {
    updateElement(selectedText.id, {
      fontWeight: e.target.checked ? BOLD_WEIGHT : NORMAL_WEIGHT,
    });
  };

  return (
    <GlobalButton
      width="auto"
      height="auto"
      fontSize="1.5rem"
      overflow="visible"
      padding="0"
      color={isDisabled ? "#4d4c4c" : "auto"}
      style={{ pointerEvents: isDisabled ? "none" : "auto" }}
    >
      <input
        type="checkbox"
        id="bold-toggle"
        style={{ display: "none" }}
        checked={isBold}
        disabled={isDisabled}
        onChange={handleChange}
      />
      <label
        htmlFor="bold-toggle"
        style={{ display: "flex", width: "100%", padding: ".5rem" }}
      >
        <BiBold />
      </label>
    </GlobalButton>
  );
};

export default BoldButton;
