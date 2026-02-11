import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const key = "dataPermissions" as const;

export interface DataPermissionsState {
  accepted: boolean;
  statistics: boolean;
  comfort: boolean;
  personalised: boolean;
  mandatory: boolean;
  hasSeenDialog: boolean; 
}

const initialState: DataPermissionsState = {
  accepted: false,
  comfort: false,
  mandatory: true,
  personalised: false,
  statistics: false,
  hasSeenDialog: false,
};

const defaultDataPermissions: DataPermissionsState = { ...initialState };

export const initializeDataPermissions = createAsyncThunk(
  "dataPermissions/initialize",
  async () => {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return defaultDataPermissions;

    try {
      const parsed = JSON.parse(stored) as Partial<DataPermissionsState>;

      // ✅ Migration-safe: falls hasSeenDialog in alten Daten fehlt
      return {
        ...defaultDataPermissions,
        ...parsed,
        mandatory: true,
        hasSeenDialog: parsed.hasSeenDialog ?? false,
      } as DataPermissionsState;
    } catch {
      return defaultDataPermissions;
    }
  }
);

export const dataPermissionsSlice = createSlice({
  name: "dataPermissions",
  initialState,
  reducers: {
    setDataPermissions: (
      state,
      { payload }: PayloadAction<DataPermissionsState>
    ) => {
      state.accepted = payload.accepted;
      state.comfort = payload.comfort;
      state.mandatory = true;
      state.personalised = payload.personalised;
      state.statistics = payload.statistics;
      state.hasSeenDialog = payload.hasSeenDialog; 

      AsyncStorage.setItem(key, JSON.stringify(state));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeDataPermissions.fulfilled, (state, { payload }) => {
      state.accepted = payload.accepted;
      state.comfort = payload.comfort;
      state.mandatory = true;
      state.personalised = payload.personalised;
      state.statistics = payload.statistics;
      state.hasSeenDialog = payload.hasSeenDialog ?? false; 

      AsyncStorage.setItem(key, JSON.stringify(state));
    });
  },
});

export const { setDataPermissions } = dataPermissionsSlice.actions;
export const selectDataPermissions = (state: RootState) => state.dataPermissions;
export default dataPermissionsSlice.reducer;
