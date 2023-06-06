import { RgbaColorPicker } from "react-colorful";
import { useDispatch, useSelector } from "react-redux";
import {
  selectKindOfPencil,
  selectPencilType,
  setColorPencil,
} from "../../features/paintingSlice";
import { debounce } from "../../utils/helper";

// this color picker only for pencils
const ColorPickerMenu = () => {
  const kindOfPencil = useSelector(selectKindOfPencil);
  const pencilType = useSelector(selectPencilType);
  const dispatch = useDispatch();
  const handleChage = debounce((e) => dispatch(setColorPencil(e)), 300);
  return (
    <>
      <RgbaColorPicker
        color={kindOfPencil[pencilType].color}
        onChange={handleChage}
      />
    </>
  );
};

export default ColorPickerMenu;
