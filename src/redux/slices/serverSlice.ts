// src/redux/slices/serverSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";
import { resolveRuntimeBaseUrl } from "../../util/runtimeBaseUrl";

const STORAGE_KEY = "servers" as const;

export type ServerEnvironment = "DEV" | "TEST" | "PROD";

export type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: ServerEnvironment;
};

export type ServersState = {
  servers: SavedServer[];
  selectedServerId: string;
  activeEnvironment: ServerEnvironment;
};

function getDefaultServer(): SavedServer {
  const runtimeBaseUrl = resolveRuntimeBaseUrl();

  const fallbackBaseUrl =
    process.env.EXPO_PUBLIC_DEFAULT_DEV_IP 
  

  return {
    id: "local",
    name: "Localhost",
    baseUrl: runtimeBaseUrl ?? fallbackBaseUrl,
    environment: "DEV",
  };
}

function getDefaultState(): ServersState {
  const defaultServer = getDefaultServer();

  return {
    servers: [defaultServer],
    selectedServerId: defaultServer.id,
    activeEnvironment: "DEV",
  };
}

/** stellt sicher dass State gültig bleibt */
function ensureValidState(
  input: ServersState | null | undefined
): ServersState {
  const defaultState = getDefaultState();

  if (!input) return defaultState;

  const servers = Array.isArray(input.servers) ? input.servers : defaultState.servers;

  const selectedServerId =
    typeof input.selectedServerId === "string"
      ? input.selectedServerId
      : servers[0].id;

  const activeEnvironment: ServerEnvironment =
    input.activeEnvironment ?? "DEV";

  const selectedExists = servers.some((s) => s.id === selectedServerId);

  return {
    servers,
    selectedServerId: selectedExists ? selectedServerId : servers[0].id,
    activeEnvironment,
  };
}

function persist(state: ServersState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const initializeServers = createAsyncThunk(
  "servers/initialize",
  async (): Promise<ServersState> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) return getDefaultState();

    try {
      const parsed = JSON.parse(raw) as ServersState;
      return ensureValidState(parsed);
    } catch {
      return getDefaultState();
    }
  }
);

const initialState: ServersState = getDefaultState();

export const serversSlice = createSlice({
  name: "servers",
  initialState,
  reducers: {
    addServer: (state, action: PayloadAction<SavedServer>) => {
      state.servers.push(action.payload);
      persist(state);
    },

    updateServer: (
      state,
      action: PayloadAction<{ id: string; name: string; baseUrl: string }>
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

      if (state.servers.length === 0) {
        const defaultServer = getDefaultServer();

        state.servers = [defaultServer];
        state.selectedServerId = defaultServer.id;
        state.activeEnvironment = "DEV";

        persist(state);
        return;
      }

      const stillExists = state.servers.some(
        (s) => s.id === state.selectedServerId
      );

      if (!stillExists) {
        state.selectedServerId = state.servers[0].id;
      }

      persist(state);
    },

    selectServer: (state, action: PayloadAction<string>) => {
      state.selectedServerId = action.payload;

      const server = state.servers.find((s) => s.id === action.payload);

      if (server) {
        state.activeEnvironment = server.environment;
      }

      persist(state);
    },

    setActiveEnvironment: (
      state,
      action: PayloadAction<ServerEnvironment>
    ) => {
      state.activeEnvironment = action.payload;

      const firstMatchingServer = state.servers.find(
        (s) => s.environment === action.payload
      );

      if (firstMatchingServer) {
        state.selectedServerId = firstMatchingServer.id;
      }

      persist(state);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(initializeServers.fulfilled, (state, action) => {
      const next = ensureValidState(action.payload);

      state.servers = next.servers;
      state.selectedServerId = next.selectedServerId;
      state.activeEnvironment = next.activeEnvironment;

      persist(state);
    });
  },
});

export const {
  addServer,
  updateServer,
  removeServer,
  selectServer,
  setActiveEnvironment,
} = serversSlice.actions;

/** selectors */

export const selectServers = (state: RootState) => state.servers;

export const selectSelectedServer = (state: RootState) => {
  const s = state.servers;
  return s.servers.find((x) => x.id === s.selectedServerId) ?? s.servers[0];
};

export const selectActiveEnvironment = (state: RootState) =>
  state.servers.activeEnvironment;

export default serversSlice.reducer;