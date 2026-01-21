// src/redux/slices/serverSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";

const STORAGE_KEY = "servers" as const;

export type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
};

export type ServersState = {
  servers: SavedServer[];
  selectedServerId: string;
};

const defaultState: ServersState = {
  servers: [{ id: "local", name: "Localhost", baseUrl: "http://localhost:8080" }],
  selectedServerId: "local",
};

export const initializeServers = createAsyncThunk(
  "servers/initialize",
  async (): Promise<ServersState> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    try {
      const parsed = JSON.parse(raw) as ServersState;

      if (!parsed?.servers?.length || !parsed?.selectedServerId) {
        return defaultState;
      }
      return parsed;
    } catch {
      return defaultState;
    }
  },
);

function persist(state: ServersState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const serversSlice = createSlice({
  name: "servers",
  initialState: defaultState,
  reducers: {
    addServer: (state, action: PayloadAction<SavedServer>) => {
      state.servers.push(action.payload);
      persist(state);
    },
    removeServer: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.servers = state.servers.filter((s) => s.id !== id);

      if (!state.servers.find((s) => s.id === state.selectedServerId)) {
        state.selectedServerId = state.servers[0]?.id ?? "local";
      }
      persist(state);
    },
    selectServer: (state, action: PayloadAction<string>) => {
      state.selectedServerId = action.payload;
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeServers.fulfilled, (state, action) => {
      state.servers = action.payload.servers;
      state.selectedServerId = action.payload.selectedServerId;
      persist(state);
    });
  },
});

export const { addServer, removeServer, selectServer } = serversSlice.actions;

export const selectServersState = (state: RootState) => state.servers;
export const selectServers = (state: RootState) => state.servers;


export const selectSelectedServer = (state: RootState) => {
  const s = state.servers;
  return s.servers.find((x) => x.id === s.selectedServerId) ?? s.servers[0];
};

export default serversSlice.reducer;
