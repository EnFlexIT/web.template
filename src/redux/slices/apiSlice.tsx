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

const defaultAuthenticationMethod: "jwt" | "oidc" = "jwt";

const defaultIp: string = __DEV__
  ? (process.env.EXPO_PUBLIC_DEFAULT_DEV_IP ?? "http://localhost:8081")
  : (process.env.EXPO_PUBLIC_DEFAULT_PROD_IP ?? "");

const defaultJwt: string | null = null;

function normalizeBaseUrl(url: string) {
  // removes trailing slash
  return url.replace(/\/+$/, "");
}

function makeRestConf(params: {
  baseUrl: string;
  jwt: string | null;
  authenticationMethod: "jwt" | "oidc";
}): RestApiConfiguration {
  const baseUrl = normalizeBaseUrl(params.baseUrl);
  const isJsonMime = new RestApiConfiguration().isJsonMime;

  // only set auth header if we really have a token
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
  authenticationMethod: "jwt" | "oidc";
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
  authenticationMethod: "jwt" | "oidc";
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

async function detectAuthenticationMethod(baseUrl: string): Promise<{
  isPointingToServer: boolean;
  authenticationMethod: "jwt" | "oidc";
}> {
  const base = normalizeBaseUrl(baseUrl);

  const infoApi = new InfoApi({
    isJsonMime: new RestApiConfiguration().isJsonMime,
    basePath: `${base}/api`,
  });

  try {
    const { data, status } = await infoApi.getAppSettings();

    if (status !== 200) {
      return { isPointingToServer: false, authenticationMethod: "jwt" };
    }

    const entries = Array.isArray((data as any)?.propertyEntries)
      ? (data as any).propertyEntries
      : [];

    const authPointer = entries.find(
      (e: any) => e?.key === "_ServerWideSecurityConfiguration",
    );

    if (!authPointer?.value) {
      // server reachable, but field missing -> treat as server true,
      // keep jwt as default to avoid falling back to DefaultApi() without config
      console.warn(
        `api init: server responded 200 on ${base} but missing _ServerWideSecurityConfiguration`,
      );
      return { isPointingToServer: true, authenticationMethod: "jwt" };
    }

    if (authPointer.value === "OIDCSecurityHandler") {
      return { isPointingToServer: true, authenticationMethod: "oidc" };
    }

    // default
    return { isPointingToServer: true, authenticationMethod: "jwt" };
  } catch {
    return { isPointingToServer: false, authenticationMethod: "jwt" };
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
  authenticationMethod: "oidc" | "jwt";
  ip: string;
  jwt: string | null;
  isLoggedIn: boolean;
  isPointingToServer: boolean;
}

export const initializeApi = createAsyncThunk(
  "api/initialize",
  async (): Promise<ApiState> => {
    const storedIp = await AsyncStorage.getItem(ipKey);
    const storedJwt = await AsyncStorage.getItem(jwtKey);

    const ip = normalizeBaseUrl(storedIp ?? defaultIp);
    const jwt = (storedJwt ?? defaultJwt) as string | null;

    const { isPointingToServer, authenticationMethod } =
      await detectAuthenticationMethod(ip);

    const apis = buildApis({ baseUrl: ip, jwt, authenticationMethod });

    const isLoggedIn =
      authenticationMethod === "jwt"
        ? jwt
          ? (jwtDecode(jwt).exp ?? 0) * 1000 > Date.now()
          : false
        : false; // for oidc you likely have a different check; keep false here

    // persist ip/jwt so web stays consistent
    await AsyncStorage.setItem(ipKey, ip);
    if (jwt) await AsyncStorage.setItem(jwtKey, jwt);
    else await AsyncStorage.removeItem(jwtKey);

    return {
      ...apis,
      authenticationMethod,
      ip,
      jwt,
      isLoggedIn,
      isPointingToServer,
    };
  },
);

export const setIpAsync = createAsyncThunk(
  "api/setIpAsync",
  async (rawIp: string, thunkAPI) => {
    const ip = normalizeBaseUrl(rawIp);

    // keep current jwt for header building
    const state = thunkAPI.getState() as RootState;
    const jwt = state.api.jwt;

    const { isPointingToServer, authenticationMethod } =
      await detectAuthenticationMethod(ip);

    await AsyncStorage.setItem(ipKey, ip);

    thunkAPI.dispatch(
      setIpLocal({
        ip,
        isPointingToServer,
        authenticationMethod,
        jwt,
      }),
    );

    return { ip, isPointingToServer, authenticationMethod };
  },
);

export const login = createAsyncThunk(
  "api/login",
  async (jwt: string, thunkAPI) => {
    thunkAPI.dispatch(setJwtLocal(jwt));
    await AsyncStorage.setItem(jwtKey, jwt);

    // Menü erst NACH jwt setzen laden
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
};

export const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    // internal only: used by setIpAsync
    setIpLocal: (
      state,
      action: PayloadAction<{
        ip: string;
        jwt: string | null;
        isPointingToServer: boolean;
        authenticationMethod: "jwt" | "oidc";
      }>,
    ) => {
      state.ip = action.payload.ip;
      state.isPointingToServer = action.payload.isPointingToServer;
      state.authenticationMethod = action.payload.authenticationMethod;

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
      state.isLoggedIn = action.payload.isLoggedIn;
      state.isPointingToServer = action.payload.isPointingToServer;
      state.jwt = action.payload.jwt;
    });

    builder.addCase(login.fulfilled, (state) => {
      state.isLoggedIn = true;
    });
  },
});

export const { setIpLocal, setJwtLocal, logout } = apiSlice.actions;

export const selectApi = (state: RootState) => state.api;
export const selectJwt = (state: RootState) => state.api.jwt;
export const selectIp = (state: RootState) => state.api.ip;
export const selectAuthenticationMethod = (state: RootState) =>
  state.api.authenticationMethod;
export const selectIsLoggedIn = (state: RootState) => state.api.isLoggedIn;

export default apiSlice.reducer;
