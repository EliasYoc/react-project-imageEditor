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
      color: "rgba(211, 13, 13, 0.10)",
    },
    chalk: {
      size: 40,
      color: "yellow",
    },
    eraser: {
      size: 50,
      color: "green",
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
