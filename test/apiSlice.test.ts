/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../util/runtimeBaseUrl", () => ({
  resolveRuntimeBaseUrl: () => null,
}));

jest.mock("../util/applicationMode", () => ({
  getApplicationMode: () => "development",
}));

jest.mock("../redux/slices/menuSlice", () => ({
  clearMenu: () => ({ type: "menu/clearMenu" }),
  initializeMenu: () => ({ type: "menu/initialize" }),
}));

jest.mock("../redux/slices/readySlice", () => ({
  setReady: (value: boolean) => ({ type: "ready/setReady", payload: value }),
}));

jest.mock("../api/implementation/AWB-RestAPI", () => {
  class MockConfiguration {
    isJsonMime = jest.fn();
  }

  class MockApi {}

  return {
    Configuration: MockConfiguration,
    AdminsApi: MockApi,
    UserApi: MockApi,
    InfoApi: MockApi,
    DoActionApi: MockApi,
  };
});

jest.mock("../api/implementation/Dynamic-Content-Api", () => {
  class MockConfiguration {
    isJsonMime = jest.fn();
  }

  class MockApi {}

  return {
    Configuration: MockConfiguration,
    DefaultApi: MockApi,
  };
});

import reducer, {
  setConnectionLocal,
  setJwtLocal,
  logoutLocal,
  setIsLoggingOut,
  setIsLogoutDialogOpen,
  initializeApi,
  login,
  switchServer,
} from "../src/redux/slices/apiSlice";

describe("apiSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isPointingToServer).toBe(false);
    expect(state.isBaseMode).toBe(false);
    expect(state.isSwitchingServer).toBe(false);
    expect(state.isLoggingOut).toBe(false);
    expect(state.isLogoutDialogOpen).toBe(false);
    expect(state.authenticationMethod).toBe("unknown");
  });

  it("should set connection local without jwt", () => {
    const state = reducer(
      undefined,
      setConnectionLocal({
        ip: "http://localhost:8080",
        jwt: null,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: true,
      }),
    );

    expect(state.ip).toBe("http://localhost:8080");
    expect(state.jwt).toBeNull();
    expect(state.isPointingToServer).toBe(true);
    expect(state.authenticationMethod).toBe("jwt");
    expect(state.isBaseMode).toBe(true);
    expect(state.isLoggedIn).toBe(false);
  });

  it("should normalize login state when jwt is set locally", () => {
    const state = reducer(undefined, setJwtLocal("invalid-token"));

    expect(state.jwt).toBe("invalid-token");
    expect(state.isLoggedIn).toBe(false);
  });

  it("should logout local", () => {
    let state = reducer(
      undefined,
      setConnectionLocal({
        ip: "http://localhost:8080",
        jwt: "invalid-token",
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
      }),
    );

    state = reducer(state, logoutLocal());

    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it("should set logging out flag", () => {
    const state = reducer(undefined, setIsLoggingOut(true));

    expect(state.isLoggingOut).toBe(true);
  });

  it("should set logout dialog flag", () => {
    const state = reducer(undefined, setIsLogoutDialogOpen(true));

    expect(state.isLogoutDialogOpen).toBe(true);
  });

  it("should handle initializeApi.fulfilled", () => {
    const current = reducer(undefined, { type: "unknown" });

    const state = reducer(current, {
      type: initializeApi.fulfilled.type,
      payload: {
        awb_rest_api: current.awb_rest_api,
        dynamic_content_api: current.dynamic_content_api,
        authenticationMethod: "jwt",
        ip: "http://localhost:8080",
        jwt: null,
        isLoggedIn: false,
        isPointingToServer: true,
        isBaseMode: true,
        isSwitchingServer: false,
        isLoggingOut: false,
        isLogoutDialogOpen: false,
      },
    });

    expect(state.authenticationMethod).toBe("jwt");
    expect(state.ip).toBe("http://localhost:8080");
    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isPointingToServer).toBe(true);
    expect(state.isBaseMode).toBe(true);
    expect(state.isSwitchingServer).toBe(false);
  });

  it("should handle login.fulfilled", () => {
    const state = reducer(undefined, {
      type: login.fulfilled.type,
    });

    expect(state.isLoggedIn).toBe(true);
    expect(state.isBaseMode).toBe(false);
  });

  it("should handle switchServer lifecycle", () => {
    let state = reducer(undefined, {
      type: switchServer.pending.type,
    });

    expect(state.isSwitchingServer).toBe(true);

    state = reducer(state, {
      type: switchServer.fulfilled.type,
    });

    expect(state.isSwitchingServer).toBe(false);

    state = reducer(state, {
      type: switchServer.rejected.type,
    });

    expect(state.isSwitchingServer).toBe(false);
  });
});
/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/apiSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux apiSlice isoliert ohne echten Server,
 * ohne echte API-Calls und ohne React UI.
 *
 * Fokus:
 * - API State
 * - Login / Logout State
 * - JWT Handling
 * - Server Connection State
 * - Server Switching State
 * - Reducer
 * - fulfilled AsyncThunk States
 * - pending / rejected Lifecycle States
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falschen Login-Status
 * - verlorene JWT Tokens
 * - fehlerhafte Logout-Logik
 * - falsche Server-IP im Redux-State
 * - kaputte Serverwechsel-Logik
 * - fehlerhafte Authentication Method
 * - falsche BaseMode-Erkennung im State
 * - kaputte Loading/Switching Flags
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Connection Reducer Tests
 * 3. JWT / Authentication Tests
 * 4. Logout Tests
 * 5. Dialog / Status Flag Tests
 * 6. fulfilled AsyncThunk Tests
 * 7. Server Switching Lifecycle Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * - API Base URL
 * - JWT Authentication
 * - Server Connection State
 * - Login State
 * - Logout State
 * - Server Switching
 * - initializeApi
 * - login
 * - switchServer
 *
 * ============================================================
 * MOCKED DEPENDENCIES
 * ============================================================
 * - AsyncStorage
 * - AWB-RestAPI
 * - Dynamic-Content-Api
 * - runtimeBaseUrl
 * - applicationMode
 * - menuSlice
 * - readySlice
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der gesamten API- und Authentifizierungslogik,
 * damit Refactoring, Serverwechsel oder Login-Änderungen keine
 * versteckten Fehler im Redux-State erzeugen.
 * ============================================================
 */