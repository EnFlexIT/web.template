// src/redux/slices/dataPermissionsSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";
import {
  DEFAULT_PERMISSION_VALUES,
  PermissionId,
  PERMISSIONS,
} from "../../permissions/PermiossionGroup";

const STORAGE_KEY = "dataPermissions";

export type DataPermissionsState = {
  values: Record<PermissionId, boolean>;
  hasSeenDialog: boolean;
};

const initialState: DataPermissionsState = {
  values: DEFAULT_PERMISSION_VALUES,
  hasSeenDialog: false,
};

export const initializeDataPermissions = createAsyncThunk(
  "dataPermissions/initialize",
  async (): Promise<DataPermissionsState> => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) return initialState;

    try {
      const parsed = JSON.parse(stored) as DataPermissionsState;

      return {
        values: {
          ...DEFAULT_PERMISSION_VALUES,
          ...parsed.values,
        },
        hasSeenDialog: parsed.hasSeenDialog ?? false,
      };
    } catch {
      return initialState;
    }
  }
);

const dataPermissionsSlice = createSlice({
  name: "dataPermissions",
  initialState,
  reducers: {
    setPermissionValue: (
      state,
      action: PayloadAction<{ id: PermissionId; value: boolean }>
    ) => {
      const { id, value } = action.payload;

      const permission = PERMISSIONS.find((p) => p.id === id);
      if (!permission || !permission.editable) return;

      state.values[id] = value;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    acceptAll: (state) => {
      PERMISSIONS.forEach((p) => {
        if (p.editable) {
          state.values[p.id] = true;
        }
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    rejectOptional: (state) => {
      PERMISSIONS.forEach((p) => {
        state.values[p.id] = p.defaultValue;
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    setHasSeenDialog: (state, action: PayloadAction<boolean>) => {
      state.hasSeenDialog = action.payload;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeDataPermissions.fulfilled, (state, action) => {
      state.values = action.payload.values;
      state.hasSeenDialog = action.payload.hasSeenDialog;
    });
  },
});

export const {
  setPermissionValue,
  acceptAll,
  rejectOptional,
  setHasSeenDialog,
} = dataPermissionsSlice.actions;

export const selectPermissionValues = (state: RootState) =>
  state.dataPermissions.values;

export default dataPermissionsSlice.reducer;
