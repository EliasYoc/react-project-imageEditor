import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  elementTextStyle: {
    fontSize: 24,
  },
  pencilType: "normal",
  pencilSizeForRangeSlider: 0,
  rangeValues: {
    minValue: 0,
    maxValue: 0,
  },
  kindOfPencilStyle: {
    normal: {
      size: 30,
      color: { r: 211, g: 13, b: 13, a: 0.1 },
    },
    chalk: {
      size: 40,
      color: { r: 255, g: 255, b: 94, a: 1 },
    },
    eraser: {
      size: 50,
      color: { r: 0, g: 217, b: 105, a: 1 },
    },
  },
};

const paintingSlice = createSlice({
  name: "paintingSlice",
  initialState,
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
  },
});

export const {
  setColorPencil,
  setPencilType,
  setSizePencil,
  setPencilSizeForRangeSlider,
  setRangeValues,
} = paintingSlice.actions;
export const selectPencilType = (state) => state.painting.pencilType;
export const selectKindOfPencil = (state) => state.painting.kindOfPencilStyle;
export const selectPencilSizeForRange = (state) =>
  state.painting.pencilSizeForRangeSlider;
export const selectRangeValues = (state) => state.painting.rangeValues;
export default paintingSlice.reducer;
