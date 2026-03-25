// src/redux/slices/apiSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { resolveRuntimeBaseUrl } from "../../util/runtimeBaseUrl";
import {
  getApplicationMode,
  type ApplicationMode,
} from "../../util/applicationMode";
import { RootState } from "../store";
import { setReady } from "./readySlice";
import {
  AdminsApi,
  Configuration as RestApiConfiguration,
  DoActionApi,
  InfoApi,
  UserApi,
} from "../../api/implementation/AWB-RestAPI";
import {
  Configuration as DynamicContentApiConfiguration,
  DefaultApi,
} from "../../api/implementation/Dynamic-Content-Api";

import { clearMenu, initializeMenu } from "./menuSlice";

const ipKey = "ip" as const;
const jwtKey = "jwt" as const;
export const jwtByServerKey = "jwtByServer" as const;
const serversKey = "servers" as const;

type AuthMethod = "jwt" | "oidc";
type JwtByServer = Record<string, string>;

const defaultAuthenticationMethod: AuthMethod = "jwt";

const fallbackDefaultIp: string = __DEV__
  ? process.env.EXPO_PUBLIC_DEFAULT_DEV_IP ?? ""
  : process.env.EXPO_PUBLIC_DEFAULT_PROD_IP ?? "";

const defaultJwt: string | null = null;

export function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function debugJwtStorage(label: string, map: Record<string, string>) {
  console.log("===== JWT STORAGE DEBUG =====");
  console.log("Context:", label);

  const keys = Object.keys(map);

  if (keys.length === 0) {
    console.log("jwtByServer EMPTY");
  } else {
    keys.forEach((k) => {
      console.log("server:", k, "token exists:", !!map[k]);
    });
  }

  console.log("=============================");
}

export async function loadJwtByServer(): Promise<JwtByServer> {
  const raw = await AsyncStorage.getItem(jwtByServerKey);

  if (!raw) return {};

  try {
    return JSON.parse(raw) as JwtByServer;
  } catch {
    return {};
  }
}

export async function saveJwtByServer(map: JwtByServer): Promise<void> {
  await AsyncStorage.setItem(jwtByServerKey, JSON.stringify(map));
}

export async function getJwtForServer(baseUrl: string): Promise<string | null> {
  const normalized = normalizeBaseUrl(baseUrl);
  const jwtByServer = await loadJwtByServer();
  return jwtByServer[normalized] ?? null;
}

export async function setJwtForServer(
  baseUrl: string,
  jwt: string | null,
): Promise<void> {
  const normalized = normalizeBaseUrl(baseUrl);
  const jwtByServer = await loadJwtByServer();

  if (jwt) {
    jwtByServer[normalized] = jwt;
  } else {
    delete jwtByServer[normalized];
  }

  await saveJwtByServer(jwtByServer);
}

async function loadSelectedServerBaseUrl(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(serversKey);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      servers?: Array<{ id: string; baseUrl: string }>;
      selectedServerId?: string;
    };

    const servers = Array.isArray(parsed?.servers) ? parsed.servers : [];
    const selectedServerId =
      typeof parsed?.selectedServerId === "string"
        ? parsed.selectedServerId
        : null;

    if (!selectedServerId) return null;

    const selected = servers.find((s) => s.id === selectedServerId);

    return selected?.baseUrl ? normalizeBaseUrl(selected.baseUrl) : null;
  } catch {
    return null;
  }
}

function resolveActiveApiBaseUrl(params: {
  mode: ApplicationMode;
  runtimeBaseUrl: string | null;
  storedIp: string | null;
  selectedServerBaseUrl: string | null;
  fallbackBaseUrl: string;
}): string {
  // Wichtig:
  // Beim Start / Reload muss der vom User ausgewählte Server Vorrang haben.
  // Danach erst gespeicherte ip, dann runtimeBaseUrl.
  return normalizeBaseUrl(
    params.selectedServerBaseUrl ??
      params.storedIp ??
      params.runtimeBaseUrl ??
      params.fallbackBaseUrl,
  );
}

function getInitialBaseUrl() {
  // Initial State ist nur Fallback für den allerersten Render.
  // Der echte Wert kommt später in initializeApi().
  return resolveActiveApiBaseUrl({
    mode: getApplicationMode(),
    runtimeBaseUrl: resolveRuntimeBaseUrl(),
    storedIp: null,
    selectedServerBaseUrl: null,
    fallbackBaseUrl: fallbackDefaultIp,
  });
}

function makeRestConf(params: {
  baseUrl: string;
  jwt: string | null;
  authenticationMethod: AuthMethod;
}): RestApiConfiguration {
  const baseUrl = normalizeBaseUrl(params.baseUrl);
  const isJsonMime = new RestApiConfiguration().isJsonMime;

  const headers =
    params.authenticationMethod === "jwt" && params.jwt
      ? { Authorization: `Bearer ${params.jwt}` }
      : undefined;

  return {
    isJsonMime,
    basePath: `${baseUrl}/api`,
    baseOptions: headers ? { headers } : undefined,
  };
}

function makeDynamicConf(params: {
  baseUrl: string;
  jwt: string | null;
  authenticationMethod: AuthMethod;
}): DynamicContentApiConfiguration {
  const baseUrl = normalizeBaseUrl(params.baseUrl);
  const isJsonMime = new DynamicContentApiConfiguration().isJsonMime;

  const headers =
    params.authenticationMethod === "jwt" && params.jwt
      ? { Authorization: `Bearer ${params.jwt}` }
      : undefined;

  return {
    isJsonMime,
    basePath: `${baseUrl}/dc`,
    baseOptions: headers ? { headers } : undefined,
  };
}

function buildApis(params: {
  baseUrl: string;
  jwt: string | null;
  authenticationMethod: AuthMethod;
}) {
  const restConf = makeRestConf(params);
  const dcConf = makeDynamicConf(params);

  return {
    awb_rest_api: {
      adminsApi: new AdminsApi(restConf),
      userApi: new UserApi(restConf),
      infoApi: new InfoApi(restConf),
      doActionApi: new DoActionApi(restConf),
    },
    dynamic_content_api: {
      defaultApi: new DefaultApi(dcConf),
    },
  };
}

async function detectServerAndMode(baseUrl: string): Promise<{
  isPointingToServer: boolean;
  authenticationMethod: AuthMethod;
  isBaseMode: boolean;
}> {
  const base = normalizeBaseUrl(baseUrl);

  const infoApi = new InfoApi({
    isJsonMime: new RestApiConfiguration().isJsonMime,
    basePath: `${base}/api`,
  });

  try {
    const { data, status } = await infoApi.getAppSettings();

    if (status !== 200) {
      return {
        isPointingToServer: false,
        authenticationMethod: "jwt",
        isBaseMode: false,
      };
    }

    const entries = Array.isArray((data as any)?.propertyEntries)
      ? (data as any).propertyEntries
      : [];

    const authCfg = entries.find(
      (e: any) => e?.key === "_ServerWideSecurityConfiguration",
    )?.value;

    const authenticatedRaw = entries.find(
      (e: any) => e?.key === "_Authenticated",
    )?.value;

    const authenticated =
      typeof authenticatedRaw === "boolean"
        ? authenticatedRaw
        : String(authenticatedRaw).toLowerCase() === "true";

    const authenticationMethod: AuthMethod =
      authCfg === "OIDCSecurityHandler" ? "oidc" : "jwt";

    const isBaseMode = authenticated === false;

    return { isPointingToServer: true, authenticationMethod, isBaseMode };
  } catch {
    return {
      isPointingToServer: false,
      authenticationMethod: "jwt",
      isBaseMode: false,
    };
  }
}

function isJwtStillValid(jwt: string | null) {
  if (!jwt) return false;

  try {
    const decoded: any = jwtDecode(jwt);
    const expMs = (decoded?.exp ?? 0) * 1000;
    return expMs > Date.now();
  } catch {
    return false;
  }
}

export interface ApiState {
  awb_rest_api: {
    adminsApi: AdminsApi;
    userApi: UserApi;
    infoApi: InfoApi;
    doActionApi: DoActionApi;
  };
  dynamic_content_api: {
    defaultApi: DefaultApi;
  };

  authenticationMethod: AuthMethod;
  ip: string;
  jwt: string | null;

  isLoggedIn: boolean;
  isPointingToServer: boolean;
  isBaseMode: boolean;
  isSwitchingServer: boolean;
}

export const initializeApi = createAsyncThunk(
  "api/initialize",
  async (): Promise<ApiState> => {
    const storedIp = await AsyncStorage.getItem(ipKey);
    const storedJwt = await AsyncStorage.getItem(jwtKey);
    const jwtByServer = await loadJwtByServer();
    const selectedServerBaseUrl = await loadSelectedServerBaseUrl();

    const runtimeBaseUrl = resolveRuntimeBaseUrl();
    const applicationMode = getApplicationMode();

    const ip = resolveActiveApiBaseUrl({
      mode: applicationMode,
      runtimeBaseUrl,
      storedIp,
      selectedServerBaseUrl,
      fallbackBaseUrl: fallbackDefaultIp,
    });

    console.log("[INITIALIZE API] runtimeBaseUrl:", runtimeBaseUrl);
    console.log("[INITIALIZE API] selectedServerBaseUrl:", selectedServerBaseUrl);
    console.log("[INITIALIZE API] storedIp:", storedIp);
    console.log("[INITIALIZE API] resolved ip:", ip);

    const jwt = (jwtByServer[ip] ?? storedJwt ?? defaultJwt) as string | null;

    console.log("[INITIALIZE API] jwt exists for resolved ip:", !!jwt);

    const { isPointingToServer, authenticationMethod, isBaseMode } =
      await detectServerAndMode(ip);

    const apis = buildApis({
      baseUrl: ip,
      jwt,
      authenticationMethod,
    });

    const isLoggedIn =
      authenticationMethod === "jwt" ? isJwtStillValid(jwt) : false;

    await AsyncStorage.setItem(ipKey, ip);

    if (jwt) {
      await AsyncStorage.setItem(jwtKey, jwt);
    } else {
      await AsyncStorage.removeItem(jwtKey);
    }

    return {
      ...apis,
      authenticationMethod,
      ip,
      jwt,
      isLoggedIn,
      isPointingToServer,
      isBaseMode,
      isSwitchingServer: false,
    };
  },
);

export const setIpAsync = createAsyncThunk(
  "api/setIpAsync",
  async (rawIp: string, thunkAPI) => {
    const ip = normalizeBaseUrl(rawIp);

    const state = thunkAPI.getState() as RootState;
    const jwt = state.api.jwt;

    const { isPointingToServer, authenticationMethod, isBaseMode } =
      await detectServerAndMode(ip);

    await AsyncStorage.setItem(ipKey, ip);

    thunkAPI.dispatch(
      setConnectionLocal({
        ip,
        jwt,
        isPointingToServer,
        authenticationMethod,
        isBaseMode,
      }),
    );

    return { ip, isPointingToServer, authenticationMethod, isBaseMode };
  },
);

export const refreshServerStatus = createAsyncThunk(
  "api/refreshServerStatus",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    if (state.api.isSwitchingServer) {
      return {
        isPointingToServer: state.api.isPointingToServer,
        authenticationMethod: state.api.authenticationMethod,
        isBaseMode: state.api.isBaseMode,
        skipped: true,
      };
    }

    const ip = state.api.ip;
    const jwt = state.api.jwt;

    const { isPointingToServer, authenticationMethod, isBaseMode } =
      await detectServerAndMode(ip);

    thunkAPI.dispatch(
      setConnectionLocal({
        ip,
        jwt,
        isPointingToServer,
        authenticationMethod,
        isBaseMode,
      }),
    );

    return { isPointingToServer, authenticationMethod, isBaseMode, skipped: false };
  },
);

export const login = createAsyncThunk(
  "api/login",
  async (
    payload: { jwt: string; baseUrl?: string },
    thunkAPI,
  ) => {
    const state = thunkAPI.getState() as RootState;

    const currentIp = normalizeBaseUrl(payload.baseUrl ?? state.api.ip);

    console.log("[LOGIN] saving jwt for:", currentIp);

    await setJwtForServer(currentIp, payload.jwt);
    await AsyncStorage.setItem(jwtKey, payload.jwt);
    await AsyncStorage.setItem(ipKey, currentIp);

    const debugMap = await loadJwtByServer();
    debugJwtStorage("after login", debugMap);

    thunkAPI.dispatch(
      setConnectionLocal({
        ip: currentIp,
        jwt: payload.jwt,
        isPointingToServer: state.api.isPointingToServer,
        authenticationMethod: state.api.authenticationMethod,
        isBaseMode: state.api.isBaseMode,
      }),
    );

    await thunkAPI.dispatch(initializeMenu());
  },
);

export const logoutAsync = createAsyncThunk(
  "api/logoutAsync",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const currentIp = normalizeBaseUrl(state.api.ip);

    console.log("[LOGOUT] removing jwt for:", currentIp);

    await setJwtForServer(currentIp, null);

    const debugMap = await loadJwtByServer();
    debugJwtStorage("after logout", debugMap);

    await AsyncStorage.removeItem(jwtKey);

    thunkAPI.dispatch(logoutLocal());
    thunkAPI.dispatch(clearMenu());
  },
);

type SwitchServerArg =
  | string
  | {
      url: string;
      initializeMenu?: boolean;
      providedJwt?: string | null;
    };

export const switchServer = createAsyncThunk(
  "api/switchServer",
  async (arg: SwitchServerArg, thunkAPI) => {
    const rawUrl = typeof arg === "string" ? arg : arg.url;
    const initializeMenuAfter =
      typeof arg === "string" ? true : arg.initializeMenu !== false;
    const providedJwt =
      typeof arg === "string" ? undefined : arg.providedJwt;

    const newUrl = normalizeBaseUrl(rawUrl);

    thunkAPI.dispatch(setReady(false));

    try {
      let nextJwt: string | null;

      if (providedJwt !== undefined) {
        nextJwt = providedJwt;
        await setJwtForServer(newUrl, providedJwt);
      } else {
        nextJwt = await getJwtForServer(newUrl);
      }

      console.log("[SWITCH SERVER] switching to:", newUrl);
      console.log("[SWITCH SERVER] jwt exists:", !!nextJwt);

      const debugMap = await loadJwtByServer();
      debugJwtStorage("after switchServer", debugMap);

      const { isPointingToServer, authenticationMethod, isBaseMode } =
        await detectServerAndMode(newUrl);

      await AsyncStorage.setItem(ipKey, newUrl);

      if (nextJwt) {
        await AsyncStorage.setItem(jwtKey, nextJwt);
      } else {
        await AsyncStorage.removeItem(jwtKey);
      }

      thunkAPI.dispatch(clearMenu());

      thunkAPI.dispatch(
        setConnectionLocal({
          ip: newUrl,
          jwt: nextJwt,
          isPointingToServer,
          authenticationMethod,
          isBaseMode,
        }),
      );

      if (initializeMenuAfter && nextJwt) {
        await thunkAPI.dispatch(initializeMenu());
      }
    } finally {
      thunkAPI.dispatch(setReady(true));
    }
  },
);

const initialBaseUrl = getInitialBaseUrl();

const initialApis = buildApis({
  baseUrl: initialBaseUrl,
  jwt: defaultJwt,
  authenticationMethod: defaultAuthenticationMethod,
});

const initialState: ApiState = {
  ...initialApis,
  authenticationMethod: defaultAuthenticationMethod,
  ip: initialBaseUrl,
  jwt: defaultJwt,
  isLoggedIn: false,
  isPointingToServer: false,
  isBaseMode: false,
  isSwitchingServer: false,
};

export const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    setConnectionLocal: (
      state,
      action: PayloadAction<{
        ip: string;
        jwt: string | null;
        isPointingToServer: boolean;
        authenticationMethod: AuthMethod;
        isBaseMode: boolean;
      }>,
    ) => {
      state.ip = action.payload.ip;
      state.isPointingToServer = action.payload.isPointingToServer;
      state.authenticationMethod = action.payload.authenticationMethod;
      state.isBaseMode = action.payload.isBaseMode;
      state.jwt = action.payload.jwt;

      const apis = buildApis({
        baseUrl: action.payload.ip,
        jwt: action.payload.jwt,
        authenticationMethod: action.payload.authenticationMethod,
      });

      state.awb_rest_api = apis.awb_rest_api;
      state.dynamic_content_api = apis.dynamic_content_api;
      state.isLoggedIn =
        action.payload.authenticationMethod === "jwt"
          ? isJwtStillValid(action.payload.jwt)
          : false;
    },

    setJwtLocal: (state, action: PayloadAction<string | null>) => {
      if (state.jwt === action.payload) return;

      state.jwt = action.payload;

      const apis = buildApis({
        baseUrl: state.ip,
        jwt: action.payload,
        authenticationMethod: state.authenticationMethod,
      });

      state.awb_rest_api = apis.awb_rest_api;
      state.dynamic_content_api = apis.dynamic_content_api;

      state.isLoggedIn =
        state.authenticationMethod === "jwt"
          ? isJwtStillValid(action.payload)
          : false;
    },

    logoutLocal: (state) => {
      state.isLoggedIn = false;
      state.jwt = null;

      const apis = buildApis({
        baseUrl: state.ip,
        jwt: null,
        authenticationMethod: state.authenticationMethod,
      });

      state.awb_rest_api = apis.awb_rest_api;
      state.dynamic_content_api = apis.dynamic_content_api;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeApi.fulfilled, (state, action) => {
      state.authenticationMethod = action.payload.authenticationMethod;
      state.awb_rest_api = action.payload.awb_rest_api;
      state.dynamic_content_api = action.payload.dynamic_content_api;

      state.ip = action.payload.ip;
      state.jwt = action.payload.jwt;

      state.isLoggedIn = action.payload.isLoggedIn;
      state.isPointingToServer = action.payload.isPointingToServer;
      state.isBaseMode = action.payload.isBaseMode;
      state.isSwitchingServer = false;
    });

    builder.addCase(login.fulfilled, (state) => {
      state.isLoggedIn = true;
    });

    builder.addCase(switchServer.pending, (state) => {
      state.isSwitchingServer = true;
    });

    builder.addCase(switchServer.fulfilled, (state) => {
      state.isSwitchingServer = false;
    });

    builder.addCase(switchServer.rejected, (state) => {
      state.isSwitchingServer = false;
    });
  },
});

export const { setConnectionLocal, setJwtLocal, logoutLocal } = apiSlice.actions;

export const selectApi = (state: RootState) => state.api;
export const selectJwt = (state: RootState) => state.api.jwt;
export const selectIp = (state: RootState) => state.api.ip;
export const selectAuthenticationMethod = (state: RootState) =>
  state.api.authenticationMethod;

export const selectIsLoggedIn = (state: RootState) => state.api.isLoggedIn;
export const selectIsPointingToServer = (state: RootState) =>
  state.api.isPointingToServer;
export const selectIsBaseMode = (state: RootState) => state.api.isBaseMode;
export const selectIsSwitchingServer = (state: RootState) =>
  state.api.isSwitchingServer;
export const selectIsBaseModule = (state: RootState) =>
  state.api.isPointingToServer && state.api.isBaseMode;

export const selectIsCustomerModule = (state: RootState) =>
  state.api.isPointingToServer &&
  state.api.isLoggedIn &&
  !state.api.isBaseMode;

export default apiSlice.reducer;