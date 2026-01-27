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

const LOCAL_SERVER: SavedServer = {
  id: "local",
  name: "Localhost",
  baseUrl: "http://localhost:8080",
};

const defaultState: ServersState = {
  servers: [LOCAL_SERVER],
  selectedServerId: LOCAL_SERVER.id,
};

/** sorgt dafür, dass es immer mindestens einen Server gibt */
function ensureValidState(input: ServersState | null | undefined): ServersState {
  const servers = Array.isArray(input?.servers) ? input!.servers : [];
  const selectedServerId =
    typeof input?.selectedServerId === "string" && input.selectedServerId
      ? input.selectedServerId
      : LOCAL_SERVER.id;

  // wenn keine Server vorhanden -> fallback local
  const normalizedServers = servers.length ? servers : [LOCAL_SERVER];

  // wenn selectedServerId nicht existiert -> erstes Element
  const selectedExists = normalizedServers.some((s) => s.id === selectedServerId);
  const normalizedSelected = selectedExists
    ? selectedServerId
    : normalizedServers[0].id;

  return {
    servers: normalizedServers,
    selectedServerId: normalizedSelected,
  };
}

function persist(state: ServersState) {
  // best effort
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const initializeServers = createAsyncThunk(
  "servers/initialize",
  async (): Promise<ServersState> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    try {
      const parsed = JSON.parse(raw) as ServersState;
      return ensureValidState(parsed);
    } catch {
      return defaultState;
    }
  },
);

export const serversSlice = createSlice({
  name: "servers",
  initialState: defaultState,
  reducers: {
    addServer: (state, action: PayloadAction<SavedServer>) => {
      state.servers.push(action.payload);

      // optional: direkt auswählen, wenn du willst:
      // state.selectedServerId = action.payload.id;

      persist(state);
    },

    updateServer: (
      state,
      action: PayloadAction<{ id: string; name: string; baseUrl: string }>,
    ) => {
      const { id, name, baseUrl } = action.payload;
      const idx = state.servers.findIndex((s) => s.id === id);
      if (idx === -1) return;

      state.servers[idx] = {
        ...state.servers[idx],
        name,
        baseUrl,
      };

      persist(state);
    },

    removeServer: (state, action: PayloadAction<string>) => {
      const id = action.payload;

      state.servers = state.servers.filter((s) => s.id !== id);

      // wenn alles gelöscht wurde -> local wieder hinzufügen
      if (state.servers.length === 0) {
        state.servers = [LOCAL_SERVER];
        state.selectedServerId = LOCAL_SERVER.id;
        persist(state);
        return;
      }

      // wenn selected gelöscht wurde -> auf ersten vorhandenen springen
      const stillExists = state.servers.some((s) => s.id === state.selectedServerId);
      if (!stillExists) {
        state.selectedServerId = state.servers[0].id;
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
      const next = ensureValidState(action.payload);
      state.servers = next.servers;
      state.selectedServerId = next.selectedServerId;
      persist(state);
    });
  },
});

export const { addServer, updateServer, removeServer, selectServer } =
  serversSlice.actions;

/** selectors */
export const selectServersState = (state: RootState) => state.servers;
export const selectServers = (state: RootState) => state.servers;

export const selectSelectedServer = (state: RootState) => {
  const s = state.servers;
  return s.servers.find((x) => x.id === s.selectedServerId) ?? s.servers[0];
};

export default serversSlice.reducer;