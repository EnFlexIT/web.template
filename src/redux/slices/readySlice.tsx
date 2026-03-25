import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface ReadyState {
  ready: boolean;
}

const initialState: ReadyState = {
  ready: false,
};

export const readySlice = createSlice({
  name: "ready",
  initialState,
  reducers: {
    setReady: (state, action: PayloadAction<boolean>) => {
      state.ready = action.payload;
    },
  },
});

export const { setReady } = readySlice.actions;

export const selectReady = (state: RootState) => state.ready.ready;

export default readySlice.reducer;