import { BiImages } from "react-icons/bi";
import { GlobalButton } from "../../components/ui/legacy/styledComponents";
import { useEditorStore } from "../../editor/store/editorStore";

const IncludeImageButton = () => {
  const addImage = useEditorStore((state) => state.addImage);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addImage(URL.createObjectURL(file));
    // Permite volver a elegir el mismo archivo.
    e.target.value = "";
  };

  return (
    <GlobalButton>
      <label htmlFor="includeImage" style={{ display: "flex" }}>
        <BiImages />
        <input
          id="includeImage"
          style={{ display: "none" }}
          type="file"
          accept="image/*"
          onChange={handleChange}
        />
      </label>
    </GlobalButton>
  );
};

export default IncludeImageButton;
