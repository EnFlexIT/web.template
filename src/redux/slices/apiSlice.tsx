import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { resolveRuntimeBaseUrl } from "../../util/runtimeBaseUrl";
import { getApplicationMode, type ApplicationMode,} from "../../util/applicationMode";
import { RootState } from "../store";
import { setReady } from "./readySlice";
import { AdminsApi,Configuration as RestApiConfiguration,  DoActionApi,InfoApi,UserApi,} from "../../api/implementation/AWB-RestAPI";
import {Configuration as DynamicContentApiConfiguration,DefaultApi,} from "../../api/implementation/Dynamic-Content-Api";
import { clearMenu, initializeMenu } from "./menuSlice";
//********************************************************************************** */
const ipKey = "ip" as const;
const jwtKey = "jwt" as const;
export const jwtByServerKey = "jwtByServer" as const;
const serversKey = "servers" as const;

export type AuthMethod = "jwt" | "oidc" | "unknown";
type JwtByServer = Record<string, string>;

const defaultAuthenticationMethod: AuthMethod = "unknown";

function getRuntimeDefaultIp() {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    const isRealWebServer =
      origin &&
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1");

    if (isRealWebServer) {
      return origin;
    }
  }

  return __DEV__
    ? process.env.EXPO_PUBLIC_DEFAULT_DEV_IP ?? ""
    : process.env.EXPO_PUBLIC_DEFAULT_PROD_IP ?? "";
}

const fallbackDefaultIp: string = getRuntimeDefaultIp();

const defaultJwt: string | null = null;

export function normalizeBaseUrl(url: string): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function debugJwtStorage(label: string, map: Record<string, string>): void {
  console.log("===== JWT STORAGE DEBUG =====");
  console.log("Context:", label);

  const keys = Object.keys(map);

  if (keys.length === 0) {
    console.log("jwtByServer EMPTY");
  } else {
    keys.forEach((key) => {
      console.log("server:", key, "token exists:", !!map[key]);
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

    const selected = servers.find((server) => server.id === selectedServerId);

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
  return normalizeBaseUrl(
    params.selectedServerBaseUrl ??
      params.runtimeBaseUrl ??
      params.storedIp ??
      params.fallbackBaseUrl,
  );
}

function getInitialBaseUrl(): string {
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
function isRedirectStatus(status?: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}
export async function fetchAppSettings(
  baseUrl: string,
  jwt?: string | null,
): Promise<Response> {
  const base = normalizeBaseUrl(baseUrl);

  return fetch(`${base}/api/app/settings/get`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(jwt
        ? {
            Authorization: `Bearer ${jwt}`,
          }
        : {}),
    },
  });
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureOidcSessionFresh(baseUrl: string): Promise<void> {
  const base = normalizeBaseUrl(baseUrl);

  for (let i = 0; i < 4; i += 1) {
    const response = await fetchAppSettings(base, null);

    if (isRedirectStatus(response.status) || response.type === "opaqueredirect") {
      return;
    }

    if (!response.ok) {
      return;
    }

    await sleep(700);
  }
}

async function detectServerAndMode(baseUrl: string): Promise<{
  isPointingToServer: boolean;
  authenticationMethod: AuthMethod;
  isBaseMode: boolean;
  authenticated: boolean;
}> {
  const base = normalizeBaseUrl(baseUrl);

  try {
      const response = await fetchAppSettings(base);


    const status = response.status;
    const contentType = response.headers.get("content-type") ?? "";

   // console.log("[DETECT SERVER] baseUrl:", base);
   // console.log("[DETECT SERVER] status:", status);
   // console.log("[DETECT SERVER] content-type:", contentType);

    if (status === 401 || status === 403) {
      return {
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: false,
      };
    }

      if (isRedirectStatus(status) || response.type === "opaqueredirect") {
      return {
        isPointingToServer: true,
        authenticationMethod: "oidc",
        isBaseMode: true,
        authenticated: false,
      };
    }

    if (status !== 200) {
      return {
        isPointingToServer: false,
        authenticationMethod: "unknown",
        isBaseMode: false,
        authenticated: false,
      };
    }

   if (!contentType.includes("application/json")) {
        return {
          isPointingToServer: true,
          authenticationMethod: "oidc",
          isBaseMode: true,
          authenticated: false,
        };
      }

    const data = await response.json();

    //console.log("[DETECT SERVER] data:", data);

    const entries = Array.isArray((data as any)?.propertyEntries)
      ? (data as any).propertyEntries
      : [];

    const authCfg = entries.find(
      (entry: any) => entry?.key === "_ServerWideSecurityConfiguration",
    )?.value;

    const authenticatedRaw = entries.find(
      (entry: any) => entry?.key === "_Authenticated",
    )?.value;

    const hasSessionId = entries.some(
      (entry: any) => entry?.key === "_session.id",
    );

    const hasSessionPathParameter = entries.some(
      (entry: any) => entry?.key === "_session.pathParameter",
    );

  const hasOidcBearer = entries.some(
  (entry: any) =>
    entry?.key === "_oidc.bearer" ||
    entry?.key === "_oidc.access_token",
);

    const authenticated =
      typeof authenticatedRaw === "boolean"
        ? authenticatedRaw
        : String(authenticatedRaw).toLowerCase() === "true";

    let authenticationMethod: AuthMethod = "unknown";
const hasAuthenticatedFlag = authenticatedRaw !== undefined;

if (authCfg === "OIDCSecurityHandler") {
  authenticationMethod = "oidc";
} else if (authCfg === "JwtSingleUserSecurityHandler") {
  authenticationMethod = "jwt";
} else if (hasSessionId || hasSessionPathParameter) {
  authenticationMethod = "oidc";
} else if (hasAuthenticatedFlag) {
  // Wichtig:
  // Wenn der Server /api/app/settings/get mit _Authenticated antwortet,
  // aber keinen JWT-401 liefert, behandeln wir das als OIDC/BaseMode.
  // OIDC liefert jetzt bewusst keinen Token mehr ans Frontend.
  authenticationMethod = "oidc";
} else {
  authenticationMethod = "unknown";
}

    return {
      isPointingToServer: true,
      authenticationMethod,
      isBaseMode: authenticated === false,
      authenticated,
    };
  } catch (error) {
    //console.error("[DETECT SERVER] failed:", error);

    return {
      isPointingToServer: false,
      authenticationMethod: "unknown",
      isBaseMode: false,
      authenticated: false,
    };
  }
}

function isJwtStillValid(jwt: string | null): boolean {
  if (!jwt) return false;

  try {
    const decoded: any = jwtDecode(jwt);
    const expMs = (decoded?.exp ?? 0) * 1000;
    return expMs > Date.now();
  } catch {
    return false;
  }
}


function computeLoggedIn(params: {
  authenticationMethod: AuthMethod;
  jwt: string | null;
  authenticated?: boolean;
}): boolean {
  if (params.authenticationMethod === "oidc") {
    return params.authenticated === true;
  }

  if (params.authenticationMethod === "jwt") {
    return isJwtStillValid(params.jwt);
  }

  return params.authenticated === true || isJwtStillValid(params.jwt);
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
  isLoggingOut: boolean;
  isLogoutDialogOpen: boolean;
}

export const initializeApi = createAsyncThunk(
  "api/initialize",
  async (): Promise<ApiState> => {
    const storedIp = await AsyncStorage.getItem(ipKey);
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

    const jwt = (jwtByServer[ip] ?? defaultJwt) as string | null;

  const {isPointingToServer,authenticationMethod, isBaseMode,authenticated, } = await detectServerAndMode(ip);

    const apis = buildApis({
      baseUrl: ip,
      jwt,
      authenticationMethod,
    });

   const isLoggedIn = computeLoggedIn({
          authenticationMethod,
          jwt,
          authenticated,
        });

        if (authenticationMethod === "oidc") {
  await ensureOidcSessionFresh(ip);
}
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
      isLoggingOut: false,
      isLogoutDialogOpen: false,
    };
  },
);

export const setIpAsync = createAsyncThunk(
  "api/setIpAsync",
  async (rawIp: string, thunkAPI) => {
    const ip = normalizeBaseUrl(rawIp);
    const jwt = await getJwtForServer(ip);

    const {
      isPointingToServer,
      authenticationMethod,
      isBaseMode,
      authenticated,
    } = await detectServerAndMode(ip);

    await AsyncStorage.setItem(ipKey, ip);

    thunkAPI.dispatch(
      setConnectionLocal({
        ip,
        jwt,
        isPointingToServer,
        authenticationMethod,
        isBaseMode,
        authenticated,
      }),
    );

    if (jwt) {
      await AsyncStorage.setItem(jwtKey, jwt);
    } else {
      await AsyncStorage.removeItem(jwtKey);
    }

    return {
      ip,
      isPointingToServer,
      authenticationMethod,
      isBaseMode,
    };
  },
);
async function removeJwtForServer(ip: string) {
  const normalizedIp = (ip ?? "")
    .trim()
    .toLowerCase();

  const raw = await AsyncStorage.getItem(jwtByServerKey);

  if (!raw) {
    return;
  }

  const parsed = JSON.parse(raw) as Record<string, string>;

  delete parsed[normalizedIp];

  await AsyncStorage.setItem(
    jwtByServerKey,
    JSON.stringify(parsed),
  );
}
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
    const storedJwt = await getJwtForServer(ip);

    const {
      isPointingToServer,
      authenticationMethod,
      isBaseMode,
      authenticated,
    } = await detectServerAndMode(ip);

    const jwt = authenticationMethod === "jwt" ? storedJwt : null;

    thunkAPI.dispatch(
      setConnectionLocal({
        ip,
        jwt,
        isPointingToServer,
        authenticationMethod,
        isBaseMode,
        authenticated,
      }),
    );

    return {
      isPointingToServer,
      authenticationMethod,
      isBaseMode,
      skipped: false,
    };
  },
);
export function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const match = value.match(/Bearer\s+(.+)/i);
  return match?.[1]?.trim() ?? null;
}

export async function loginWithBasic(params: {
  baseUrl: string;
  basic: string;
  credentials?: RequestCredentials;
}): Promise<{
  response: Response;
  bearerToken: string | null;
  bodyText: string;
}> {
  const baseUrl = normalizeBaseUrl(params.baseUrl);

  const response = await fetch(`${baseUrl}/api/user/login`, {
    method: "GET",
    cache: "no-store",
    credentials: params.credentials ?? "include",
    headers: {
      Authorization: `Basic ${params.basic}`,
      Accept: "application/json",
    },
  });

  const header =
    response.headers.get("www-authenticate") ??
    response.headers.get("WWW-Authenticate") ??
    response.headers.get("authorization") ??
    response.headers.get("Authorization");

  const bodyText = await response.text();
  const bearerToken =
    extractBearerToken(header) ?? extractBearerToken(bodyText);

  return {
    response,
    bearerToken,
    bodyText,
  };
}
export const login = createAsyncThunk(
  "api/login",
  async (payload: { jwt: string; baseUrl?: string }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const currentIp = normalizeBaseUrl(payload.baseUrl ?? state.api.ip);

    await setJwtForServer(currentIp, payload.jwt);
    await AsyncStorage.setItem(jwtKey, payload.jwt);
    await AsyncStorage.setItem(ipKey, currentIp);

    thunkAPI.dispatch(
      setConnectionLocal({
        ip: currentIp,
        jwt: payload.jwt,
        isPointingToServer: state.api.isPointingToServer,
        authenticationMethod: state.api.authenticationMethod,
        isBaseMode: false,
        authenticated: true,
        
      }),
    );

    await thunkAPI.dispatch(initializeMenu());
  },
);
async function logoutFromServer(params: {
  baseUrl: string;
  jwt: string | null;
}): Promise<void> {
  const baseUrl = normalizeBaseUrl(params.baseUrl);

  if (!baseUrl || !params.jwt) {
    return;
  }

  await fetch(`${baseUrl}/api/user/logout`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.jwt}`,
      Accept: "application/json",
    },
    credentials: "include",
  });
}
export const logoutAsync = createAsyncThunk(
  "api/logoutAsync",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    const currentIp = normalizeBaseUrl(state.api.ip);
    const jwt = state.api.jwt;
    const authenticationMethod = state.api.authenticationMethod;

    const isOidc =
      authenticationMethod === "oidc" || authenticationMethod === "unknown";

    thunkAPI.dispatch(setIsLoggingOut(true));

    try {
     if (currentIp && jwt && !isOidc) {
        try {
          await logoutFromServer({
            baseUrl: currentIp,
            jwt,
          });
        } catch (error) {
          console.warn("[LOGOUT] server logout failed", error);
        }
      }

      await setJwtForServer(currentIp, null);
      await AsyncStorage.removeItem(jwtKey);

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(
          `postLoginAutoReloadChecked::${currentIp}`,
        );
      }

      thunkAPI.dispatch(logoutLocal());
      thunkAPI.dispatch(clearMenu());
    } finally {
      thunkAPI.dispatch(setIsLoggingOut(false));
      thunkAPI.dispatch(setIsLogoutDialogOpen(false));
    }
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
        thunkAPI.dispatch(setReady(false));

    try {
      const rawUrl = typeof arg === "string" ? arg : arg.url;
      const initializeMenuAfter =
        typeof arg === "string" ? true : arg.initializeMenu !== false;
      const providedJwt =
        typeof arg === "string" ? undefined : arg.providedJwt;

      const newUrl = normalizeBaseUrl(rawUrl);

      let nextJwt: string | null;

      if (providedJwt !== undefined) {
        nextJwt = providedJwt;
        await setJwtForServer(newUrl, providedJwt);
      } else {
        nextJwt = await getJwtForServer(newUrl);
      }

        const {
        isPointingToServer,
        authenticationMethod,
        isBaseMode,
        authenticated,
      } = await detectServerAndMode(newUrl);
     if (authenticationMethod === "oidc") {
  nextJwt = null;
  await setJwtForServer(newUrl, null);
}

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
        authenticated,
      }),
    );
          const nextLoggedIn = computeLoggedIn({
        authenticationMethod,
        jwt: nextJwt,
        authenticated,
      });

      if (initializeMenuAfter && nextLoggedIn) {
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
  isLoggingOut: false,
  isLogoutDialogOpen: false,
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
      authenticated: boolean;
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
      state.isLoggedIn = computeLoggedIn({
        authenticationMethod: action.payload.authenticationMethod,
        jwt: action.payload.jwt,
        authenticated: action.payload.authenticated,
      });
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

      state.isLoggedIn = computeLoggedIn({
        authenticationMethod: state.authenticationMethod,
        jwt: action.payload,
        authenticated: state.isBaseMode === false,
      });
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

    setIsLoggingOut: (state, action: PayloadAction<boolean>) => {
      state.isLoggingOut = action.payload;
    },

    setIsLogoutDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.isLogoutDialogOpen = action.payload;
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
      state.isBaseMode = false;
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

export const {
  setConnectionLocal,
  setJwtLocal,
  logoutLocal,
  setIsLoggingOut,
  setIsLogoutDialogOpen,
} = apiSlice.actions;

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
export const selectIsLoggingOut = (state: RootState) => state.api.isLoggingOut;
export const selectIsLogoutDialogOpen = (state: RootState) =>
  state.api.isLogoutDialogOpen;

export const selectIsBaseModule = (state: RootState) =>
  state.api.isPointingToServer && state.api.isBaseMode;

export const selectIsCustomerModule = (state: RootState) =>
  state.api.isPointingToServer &&
  state.api.isLoggedIn &&
  !state.api.isBaseMode;

export default apiSlice.reducer;