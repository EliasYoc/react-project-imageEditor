import { createSlice } from "@reduxjs/toolkit";

export const initialBgMultiInputRange = {
  firstInputRange: {
    id: "firstInputRange",
    thumbBackground: { r: 52, g: 201, b: 100, a: 1 },
    thumbBorder: "2px solid black",
    thumbValue: 10,
  },
  secondInputRange: {
    id: "secondInputRange",
    thumbBackground: { r: 97, g: 29, b: 173, a: 1 },
    thumbBorder: "2px solid black",
    thumbValue: 70,
  },
};

export const initialPaintingState = {
  idOfSelectedDraggableText: null,
  colorOfSelectedDraggableText: { r: 0, g: 0, b: 0, a: 1 },
  draggableTextFontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  elementTextStyle: {
    fontSize: 24,
  },
  pencilType: "normal",
  pencilSizeForRangeSlider: 0,
  rangeValues: {
    minValue: 0,
    maxValue: 0,
  },
  gradientBgMultiInputRange: initialBgMultiInputRange,
  gradientInputRangeDegree: {
    degree: {
      id: "degree",
      thumbBackground: { r: 255, g: 255, b: 224, a: 1 },
      thumbBorder: "2px solid black",
      thumbValue: 180,
    },
  },
  kindOfPencilStyle: {
    normal: {
      size: 50,
      color: { r: 0, g: 0, b: 0, a: 1 },
    },
    chalk: {
      size: 50,
      color: { r: 255, g: 255, b: 94, a: 1 },
    },
    eraser: {
      size: 50,
      color: { r: 255, g: 255, b: 255, a: 1 },
    },
    spray: {
      size: 100,
      color: { r: 211, g: 13, b: 13, a: 0.45 },
    },
  },
};

const paintingSlice = createSlice({
  name: "paintingSlice",
  initialState: initialPaintingState,
  reducers: {
    setColorPencil(state, { payload }) {
      state.kindOfPencilStyle[state.pencilType].color = payload;
    },
    setSizePencil(state, { payload }) {
      state.kindOfPencilStyle[state.pencilType].size = payload;
    },
    setPencilSizeForRangeSlider(state, { payload }) {
      state.pencilSizeForRangeSlider = payload;
    },
    setPencilType(state, { payload }) {
      state.pencilType = payload;
    },
    setRangeValues(state, { payload }) {
      state.rangeValues = payload;
    },
    addNewInputRange(state, { payload }) {
      state.gradientBgMultiInputRange[payload.id] = payload;
    },
    deleteInputRange(state, { payload }) {
      delete state.gradientBgMultiInputRange[payload.id];
    },
    changeMultipleInputValue(state, { payload }) {
      state.gradientBgMultiInputRange[payload.id].thumbValue = payload.value;
    },
    changeInpurRangeGradientDegree(state, { payload }) {
      state.gradientInputRangeDegree.degree.thumbValue = payload;
    },
    changeColorMultiInputRange(state, { payload }) {
      state.gradientBgMultiInputRange[payload.id].thumbBackground =
        payload.background;
    },
    applyDraggableTextId(state, { payload }) {
      state.idOfSelectedDraggableText = payload;
    },
    applyDraggableTextColor(state, { payload }) {
      state.colorOfSelectedDraggableText = payload;
    },
    applyDraggableTextFontFamily(state, { payload }) {
      state.draggableTextFontFamily = payload;
    },
  },
});

export const {
  setColorPencil,
  setPencilType,
  setSizePencil,
  setPencilSizeForRangeSlider,
  setRangeValues,
  addNewInputRange,
  changeMultipleInputValue,
  changeInpurRangeGradientDegree,
  deleteInputRange,
  changeColorMultiInputRange,
  applyDraggableTextId,
  applyDraggableTextColor,
  applyDraggableTextFontFamily,
} = paintingSlice.actions;
export const selectPencilType = (state) => state.painting.pencilType;
export const selectKindOfPencil = (state) => state.painting.kindOfPencilStyle;
export const selectPencilSizeForRange = (state) =>
  state.painting.pencilSizeForRangeSlider;
export const selectRangeValues = (state) => state.painting.rangeValues;
export const selectGradientMultiIntputRange = (state) =>
  state.painting.gradientBgMultiInputRange;
export const selectGradientInputRangeDegree = (state) =>
  state.painting.gradientInputRangeDegree;
export const selectDraggableTextId = (state) =>
  state.painting.idOfSelectedDraggableText;
export const selectDraggableTextColor = (state) =>
  state.painting.colorOfSelectedDraggableText;
export const selectDraggableTextFontFamily = (state) =>
  state.painting.draggableTextFontFamily;
export default paintingSlice.reducer;
