import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UnistylesRuntime } from "react-native-unistyles";

export interface ReadyState {
  ready: boolean;
}

const initialState: ReadyState = { ready: true };

export const readySlice = createSlice({
  name: "ready",
  initialState,
  reducers: {
    setReady: (state, action: PayloadAction<ReadyState>) => {
      state.ready = action.payload.ready;
    },
  },
});

export const { setReady } = readySlice.actions;

export const selectReady = (state: RootState) => state.ready;

export default readySlice.reducer;
