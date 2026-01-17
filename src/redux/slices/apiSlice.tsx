// src/redux/slices/apiSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

import { RootState } from "../store";
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

import { initializeMenu } from "./menuSlice";

const ipKey = "ip" as const;
const jwtKey = "jwt" as const;

type AuthMethod = "jwt" | "oidc";

const defaultAuthenticationMethod: AuthMethod = "jwt";

const defaultIp: string = __DEV__
  ? (process.env.EXPO_PUBLIC_DEFAULT_DEV_IP ?? "http://localhost:8081")
  : (process.env.EXPO_PUBLIC_DEFAULT_PROD_IP ?? "");

const defaultJwt: string | null = null;

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
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

/**
 *  Detects:
 * - isPointingToServer: server reachable (200)
 * - authenticationMethod: jwt vs oidc via _ServerWideSecurityConfiguration
 * - isBaseMode: _Authenticated === false  (device/base runtime BEFORE user login)
 */
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
    // calls: GET {base}/api/app/settings/get
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

    const authenticatedRaw = entries.find((e: any) => e?.key === "_Authenticated")
      ?.value;

    // _Authenticated comes often as "false"/"true" strings
    const authenticated =
      typeof authenticatedRaw === "boolean"
        ? authenticatedRaw
        : String(authenticatedRaw).toLowerCase() === "true";

    const authenticationMethod: AuthMethod =
      authCfg === "OIDCSecurityHandler" ? "oidc" : "jwt";

    //  BaseMode = device reports NOT authenticated (pre-login mode)
    const isBaseMode = authenticated === false;

    return { isPointingToServer: true, authenticationMethod, isBaseMode };
  } catch (err) {
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

  /**
   *  BaseMode: device was detected (server reachable) and _Authenticated=false
   * => show Base/Admin mode entry BEFORE normal employee login.
   */
  isBaseMode: boolean;
}

export const initializeApi = createAsyncThunk(
  "api/initialize",
  async (): Promise<ApiState> => {
    const storedIp = await AsyncStorage.getItem(ipKey);
    const storedJwt = await AsyncStorage.getItem(jwtKey);

    const ip = normalizeBaseUrl(storedIp ?? defaultIp);
    const jwt = (storedJwt ?? defaultJwt) as string | null;

    const { isPointingToServer, authenticationMethod, isBaseMode } =
      await detectServerAndMode(ip);

    // Important: Build API clients with whatever we currently have (jwt may be null)
    const apis = buildApis({ baseUrl: ip, jwt, authenticationMethod });

    //  logged-in only if JWT exists and valid (OIDC handled separately; keep false here)
    const isLoggedIn =
      authenticationMethod === "jwt" ? isJwtStillValid(jwt) : false;

    // persist ip / jwt
    await AsyncStorage.setItem(ipKey, ip);
    if (jwt) await AsyncStorage.setItem(jwtKey, jwt);
    else await AsyncStorage.removeItem(jwtKey);

    //  Menu init strategy:
    // - If BaseMode: load menu WITHOUT login (server/device admin pages etc.)
    // - If LoggedIn: load menu normally (needs Authorization)
    // If your DC menu endpoint requires auth, BaseMode should point to an endpoint that is public on device.
    // We'll still try to init menu in both cases; if it errors, your menuSlice should fallback to static menu.
    // (We'll adjust menuSlice next.)
    // Note: We do not dispatch here to avoid circular deps; RootStack should call initializeMenu after initApi.

    return {
      ...apis,
      authenticationMethod,
      ip,
      jwt,
      isLoggedIn,
      isPointingToServer,
      isBaseMode,
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

export const login = createAsyncThunk(
  "api/login",
  async (jwt: string, thunkAPI) => {
    thunkAPI.dispatch(setJwtLocal(jwt));
    await AsyncStorage.setItem(jwtKey, jwt);

    // Menu after JWT exists
    await thunkAPI.dispatch(initializeMenu());
  },
);

const initialApis = buildApis({
  baseUrl: defaultIp,
  jwt: defaultJwt,
  authenticationMethod: defaultAuthenticationMethod,
});

const initialState: ApiState = {
  ...initialApis,
  authenticationMethod: defaultAuthenticationMethod,
  ip: normalizeBaseUrl(defaultIp),
  jwt: defaultJwt,
  isLoggedIn: false,
  isPointingToServer: false,
  isBaseMode: false,
};

export const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    /**
     *  replaces  old setIpLocal
     * sets ip + connection flags and rebuilds API clients
     */
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

      const apis = buildApis({
        baseUrl: action.payload.ip,
        jwt: action.payload.jwt,
        authenticationMethod: action.payload.authenticationMethod,
      });

      state.awb_rest_api = apis.awb_rest_api;
      state.dynamic_content_api = apis.dynamic_content_api;
    },

    setJwtLocal: (state, action: PayloadAction<string | null>) => {
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

    logout: (state) => {
      state.isLoggedIn = false;
      state.jwt = null;
      AsyncStorage.removeItem(jwtKey);

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
    });

    builder.addCase(login.fulfilled, (state) => {
      state.isLoggedIn = true;
    });
  },
});

export const { setConnectionLocal, setJwtLocal, logout } = apiSlice.actions;

export const selectApi = (state: RootState) => state.api;
export const selectJwt = (state: RootState) => state.api.jwt;
export const selectIp = (state: RootState) => state.api.ip;
export const selectAuthenticationMethod = (state: RootState) =>
  state.api.authenticationMethod;

export const selectIsLoggedIn = (state: RootState) => state.api.isLoggedIn;
export const selectIsPointingToServer = (state: RootState) =>
  state.api.isPointingToServer;
export const selectIsBaseMode = (state: RootState) => state.api.isBaseMode;

export default apiSlice.reducer;
