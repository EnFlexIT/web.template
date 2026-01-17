import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";

const baseModeKey = "baseModeLoggedIn" as const;

export interface BaseModeState {
  baseModeLoggedIn: boolean;
}

const initialState: BaseModeState = {
  baseModeLoggedIn: false,
};

export const baseModeSlice = createSlice({
  name: "baseMode",
  initialState,
  reducers: {
    setBaseModeLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.baseModeLoggedIn = action.payload;

      // Persist (best effort)
      if (action.payload) AsyncStorage.setItem(baseModeKey, "true");
      else AsyncStorage.removeItem(baseModeKey);
    },

    logoutBaseMode: (state) => {
      state.baseModeLoggedIn = false;
      AsyncStorage.removeItem(baseModeKey);
    },
  },
});

export const { setBaseModeLoggedIn, logoutBaseMode } = baseModeSlice.actions;

export const selectBaseMode = (state: RootState) => state.baseMode;

export default baseModeSlice.reducer;
