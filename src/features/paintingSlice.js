import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  elementTextStyle: {
    fontSize: 24,
  },
  kindOfPencil: {},
};

const paintingSlice = createSlice({
  name: "paintingSlice",
  initialState,
  reducers: {},
});

export const {} = paintingSlice.actions;

export default paintingSlice.reducer;
