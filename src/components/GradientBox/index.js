import React, { useContext, useRef, useEffect, useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import {
  addNewInputRange,
  changeColorMultiInputRange,
  changeInpurRangeGradientDegree,
  changeMultipleInputValue,
  deleteInputRange,
  initialBgMultiInputRange,
  selectGradientInputRangeDegree,
  selectGradientMultiIntputRange,
} from "../../features/paintingSlice";
import {
  debounce,
  reduceAspectRatioQualityOfIncomingImage,
} from "../../utils/helper";
import { GlobalButton, GlobalSpinner } from "../../utils/styledComponents";
import MultiInputRange from "../MultiInputRange";
import {
  ApplyGradientButton,
  GradientContainer,
  GradientPreviewContainer,
  WrapperColorPicker,
  WrapperGradientOptions,
} from "./styles";
import { v4 as uuidv4 } from "uuid";
import { bestFitGradient } from "../../utils/canvas";
import { RgbaColorPicker } from "react-colorful";

const GradientBox = ({ handleOpenGradientBox }) => {
  const { canvasSize, setLowQualityDataImageLoaded, setPrincipalImageLoaded } =
    useContext(ContextConfiguration);
  const multipleInputRange = useSelector(selectGradientMultiIntputRange);
  const inputRangeKeyList = Object.keys(multipleInputRange);

  const multipleInputRangeDegree = useSelector(selectGradientInputRangeDegree);
  const dispatch = useDispatch();
  const refCanvasPreview = useRef();
  const [thumbId, setThumbId] = useState(inputRangeKeyList.at(-1));
  const [isApplyingGradient, setIsApplyingGradient] = useState(false);

  useEffect(
    function editingCanvasPreview() {
      const ctx = refCanvasPreview.current.getContext("2d");
      const colorList = Object.values(multipleInputRange).map(
        (inputRangeProps) => {
          const { r, g, b, a } = inputRangeProps.thumbBackground;
          return {
            opacity: inputRangeProps.thumbValue / 100,
            backgroundString: `rgba(${r},${g},${b},${a})`,
          };
        }
      );
      const w = refCanvasPreview.current.width;
      const h = refCanvasPreview.current.height;
      const gradient = bestFitGradient({
        angle: (multipleInputRangeDegree.degree.thumbValue * Math.PI) / 180,
        colorList,
        ctx,
        w,
        h,
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    },
    [multipleInputRange, multipleInputRangeDegree.degree.thumbValue]
  );

  const { newWidth, newHeight } = reduceAspectRatioQualityOfIncomingImage({
    options: canvasSize,
    expectedMaxPixelsSize: 300,
  });
  console.log(newWidth, newHeight);

  const handleMultiInputRangeChange = (e) => {
    dispatch(
      changeMultipleInputValue({ id: e.target.id, value: e.target.value })
    );
  };

  const addInputRange = () => {
    if (inputRangeKeyList.length >= 8) return;
    dispatch(
      addNewInputRange({
        ...initialBgMultiInputRange.firstInputRange,
        id: uuidv4(),
      })
    );
  };

  const deleteSelectedInputRange = () => {
    const filteredIdListOfInputRange = inputRangeKeyList.filter(
      (rangeId) => rangeId !== thumbId
    );
    if (filteredIdListOfInputRange.length) {
      const lastRangeThumbId = filteredIdListOfInputRange.at(-1);
      console.log("last id ", lastRangeThumbId);
      dispatch(deleteInputRange({ id: thumbId }));
      setThumbId(lastRangeThumbId);
    }
  };

  const handleMouseTouchStart = (e) => {
    e.target.focus();
    setThumbId(e.target.id);
  };

  const changeGradientDegree = (e) => {
    dispatch(changeInpurRangeGradientDegree(e.target.value));
  };

  const changeGradientColorOfRange = debounce(
    (e) => dispatch(changeColorMultiInputRange({ id: thumbId, background: e })),
    300
  );

  const applyGradientBackground = () => {
    setIsApplyingGradient(true);
    setTimeout(() => {
      const lowQualityUrl = refCanvasPreview.current.toDataURL(
        "image/jpeg",
        ".1"
      );
      const url = refCanvasPreview.current.toDataURL("image/png");
      const $img = new Image();
      $img.src = url;
      setLowQualityDataImageLoaded(lowQualityUrl);
      setPrincipalImageLoaded($img);
      handleOpenGradientBox(false);
      setIsApplyingGradient(false);
    }, 0);
  };

  return (
    <GradientContainer>
      <GradientPreviewContainer>
        <canvas
          ref={refCanvasPreview}
          style={{
            borderRadius: ".5rem",
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          }}
          width={canvasSize.width}
          height={canvasSize.height}
        >
          Not supported
        </canvas>
        {console.log(multipleInputRange, thumbId)}

        <WrapperColorPicker>
          {thumbId && (
            <RgbaColorPicker
              color={multipleInputRange[thumbId].thumbBackground}
              onChange={changeGradientColorOfRange}
            />
          )}
          <WrapperGradientOptions>
            <GlobalButton onClick={addInputRange}>
              <AiOutlinePlus />
            </GlobalButton>
            {thumbId && (
              <GlobalButton onClick={deleteSelectedInputRange}>
                <AiOutlineMinus />
              </GlobalButton>
            )}
          </WrapperGradientOptions>
        </WrapperColorPicker>
      </GradientPreviewContainer>
      <div>
        <MultiInputRange
          style={{ margin: "2.5rem 0" }}
          onClickLine={addInputRange}
          onMouseTouchStartThumb={handleMouseTouchStart}
          onChange={handleMultiInputRangeChange}
          inputPropListObj={multipleInputRange}
          lineCursor="copy"
          thumbCursor="pointer"
          min="0"
          max="100"
        />

        <MultiInputRange
          style={{ margin: "2.5rem 0" }}
          onChange={changeGradientDegree}
          thumbCursor="pointer"
          inputPropListObj={multipleInputRangeDegree}
          min="0"
          max="360"
        ></MultiInputRange>
      </div>
      <ApplyGradientButton type="button" onClick={applyGradientBackground}>
        <span>Aplicar fondo</span>
        {isApplyingGradient && (
          <GlobalSpinner width="20px" height="20px" border="2px solid #fff" />
        )}
      </ApplyGradientButton>
    </GradientContainer>
  );
};

export default GradientBox;
