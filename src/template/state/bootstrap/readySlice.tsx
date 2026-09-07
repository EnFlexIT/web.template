import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TemplateRootState } from '@/template/state/store/templateStoreTypes';

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

export const selectReady = (state: TemplateRootState) => state.ready.ready;

export default readySlice.reducer;