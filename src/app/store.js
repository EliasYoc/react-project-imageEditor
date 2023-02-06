import { configureStore } from "@reduxjs/toolkit";
import paintingSlice from "../features/paintingSlice";

export const store = configureStore({
  reducer: {
    painting: paintingSlice,
  },
});
