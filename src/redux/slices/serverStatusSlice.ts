import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type ServerStatusTone = "green" | "yellow" | "red";

export type ServerStatusMeta = {
  tone: ServerStatusTone;
  subtitle: string;
};

type ServerStatusState = {
  byServerId: Record<string, ServerStatusMeta>;
};

const initialState: ServerStatusState = {
  byServerId: {},
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState,
  reducers: {
    setServerStatus: (
      state,
      action: PayloadAction<{
        serverId: string;
        status: ServerStatusMeta;
      }>,
    ) => {
      state.byServerId[action.payload.serverId] = action.payload.status;
    },

    setServerStatuses: (
      state,
      action: PayloadAction<Record<string, ServerStatusMeta>>,
    ) => {
      state.byServerId = action.payload;
    },

    clearServerStatus: (state, action: PayloadAction<string>) => {
      delete state.byServerId[action.payload];
    },

    clearAllServerStatuses: (state) => {
      state.byServerId = {};
    },
  },
});

export const {
  setServerStatus,
  setServerStatuses,
  clearServerStatus,
  clearAllServerStatuses,
} = serverStatusSlice.actions;

export const selectServerStatuses = (state: RootState) =>
  state.serverStatus.byServerId;

export default serverStatusSlice.reducer;