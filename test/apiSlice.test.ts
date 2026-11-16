/// <reference types="jest" />

jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require(
      "@react-native-async-storage/async-storage/jest/async-storage-mock",
    ),
);

jest.mock("../src/core/server/runtimeBaseUrl", () => ({
  resolveRuntimeBaseUrl: () => null,
}));

jest.mock("../src/core/runtime/applicationMode", () => ({
  getApplicationMode: () => "development",
}));

jest.mock("@/template/state/navigation/menuSlice", () => ({
  clearMenu: () => ({
    type: "menu/clearMenu",
  }),

  initializeMenu: () => ({
    type: "menu/initialize",
  }),
}));

jest.mock("../src/template/state/bootstrap/readySlice", () => ({
  setReady: (value: boolean) => ({
    type: "ready/setReady",
    payload: value,
  }),
}));

jest.mock(
  "../src/api/implementation/AWB-RestAPI",
  () => {
    class MockConfiguration {
      isJsonMime = jest.fn();
    }

    class MockApi {}

    return {
      Configuration: MockConfiguration,
      AdminsApi: MockApi,
      UserApi: MockApi,
      InfoApi: MockApi,
    };
  },
);

jest.mock(
  "../src/api/implementation/Dynamic-Content-Api",
  () => {
    class MockConfiguration {
      isJsonMime = jest.fn();
    }

    class MockApi {}

    return {
      Configuration: MockConfiguration,
      DefaultApi: MockApi,
    };
  },
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import reducer, {
  initializeApi,
  login,
  logoutLocal,
  setConnectionLocal,
  setIsLoggingOut,
  setIsLogoutDialogOpen,
  setJwtLocal,
  switchServer,
  setJwtForServer,
  loadJwtByServer,
  jwtByServerKey,
} from "@/template/state/api/apiSlice";

/**
 * JWT mit einem Ablaufdatum in der Zukunft.
 * Eine Signatur ist fÃ¼r jwtDecode im Test nicht notwendig.
 */
const VALID_TEST_JWT =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0." +
  "eyJleHAiOjQxMDI0NDQ4MDB9.";

describe("apiSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, {
      type: "unknown",
    });

    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isPointingToServer).toBe(false);
    expect(state.isBaseMode).toBe(false);
    expect(state.isSwitchingServer).toBe(false);
    expect(state.isLoggingOut).toBe(false);
    expect(state.isLogoutDialogOpen).toBe(false);
    expect(state.authenticationMethod).toBe(
      "unknown",
    );
  });

  it("V2 state: rotates the client on server changes", () => {
    const first = reducer(
      undefined,
      setConnectionLocal({
        ip: "https://server-a.example",
        jwt: null,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: false,
      }),
    );

    const second = reducer(
      first,
      setConnectionLocal({
        ip: "https://server-b.example",
        jwt: null,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: false,
      }),
    );

    expect((first.dynamic_content_api_v2.defaultApi as unknown as { configuration: { basePath?: string } }).configuration.basePath)
      .toBe("https://server-a.example/dc");
    expect((second.dynamic_content_api_v2.defaultApi as unknown as { configuration: { basePath?: string } }).configuration.basePath)
      .toBe("https://server-b.example/dc");
    expect(second.dynamic_content_api_v2.defaultApi)
      .not.toBe(first.dynamic_content_api_v2.defaultApi);
  });

  it("V2 state: refreshes the client after a JWT change", () => {
    const first = reducer(
      undefined,
      setConnectionLocal({
        ip: "https://server-a.example",
        jwt: "old-token",
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: false,
      }),
    );

    const second = reducer(first, setJwtLocal("new-token"));

    const inspect = (state: typeof first) =>
      state.dynamic_content_api_v2.defaultApi as unknown as {
        configuration: {
          baseOptions?: {
            headers?: Record<string, string>;
          };
        };
      };

    expect(inspect(first).configuration.baseOptions?.headers?.Authorization)
      .toBe("Bearer old-token");
    expect(inspect(second).configuration.baseOptions?.headers?.Authorization)
      .toBe("Bearer new-token");
    expect(second.dynamic_content_api_v2.defaultApi)
      .not.toBe(first.dynamic_content_api_v2.defaultApi);
  });

  it("V2 state: clears the JWT configuration on logout", () => {
    const loggedIn = reducer(
      undefined,
      setConnectionLocal({
        ip: "https://server-a.example",
        jwt: VALID_TEST_JWT,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: true,
      }),
    );

    const loggedOut = reducer(loggedIn, logoutLocal());

    const client = loggedOut.dynamic_content_api_v2.defaultApi as unknown as {
      configuration: {
        baseOptions?: {
          headers?: Record<string, string>;
        };
      };
    };

    expect(loggedOut.jwt).toBeNull();
    expect(loggedOut.isLoggedIn).toBe(false);
    expect(client.configuration.baseOptions?.headers?.Authorization)
      .toBeUndefined();
    expect(loggedOut.dynamic_content_api_v2.defaultApi)
      .not.toBe(loggedIn.dynamic_content_api_v2.defaultApi);
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
        authenticated: false,
      }),
    );

    expect(state.ip).toBe(
      "http://localhost:8080",
    );

    expect(state.jwt).toBeNull();
    expect(state.isPointingToServer).toBe(
      true,
    );

    expect(state.authenticationMethod).toBe(
      "jwt",
    );

    expect(state.isBaseMode).toBe(true);
    expect(state.isLoggedIn).toBe(false);
  });

  it("should normalize login state when jwt is set locally", () => {
    const state = reducer(
      undefined,
      setJwtLocal("invalid-token"),
    );

    expect(state.jwt).toBe("invalid-token");
    expect(state.isLoggedIn).toBe(false);
  });

  it("should logout local", () => {
    let state = reducer(
      undefined,
      setConnectionLocal({
        ip: "http://localhost:8080",
        jwt: VALID_TEST_JWT,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: true,
      }),
    );

    expect(state.jwt).toBe(VALID_TEST_JWT);
    expect(state.isLoggedIn).toBe(true);

    state = reducer(
      state,
      logoutLocal(),
    );

    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it("should set logging out flag", () => {
    const state = reducer(
      undefined,
      setIsLoggingOut(true),
    );

    expect(state.isLoggingOut).toBe(true);
  });

  it("should set logout dialog flag", () => {
    const state = reducer(
      undefined,
      setIsLogoutDialogOpen(true),
    );

    expect(state.isLogoutDialogOpen).toBe(
      true,
    );
  });

  it("should handle initializeApi.fulfilled", () => {
    const current = reducer(undefined, {
      type: "unknown",
    });

    const state = reducer(current, {
      type: initializeApi.fulfilled.type,

      payload: {
        awb_rest_api:
          current.awb_rest_api,

        dynamic_content_api:
          current.dynamic_content_api,

        dynamic_content_api_v2:
          current.dynamic_content_api_v2,

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

    expect(
      state.authenticationMethod,
    ).toBe("jwt");

    expect(state.ip).toBe(
      "http://localhost:8080",
    );

    expect(state.jwt).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isPointingToServer).toBe(
      true,
    );

    expect(state.isBaseMode).toBe(true);
    expect(state.isSwitchingServer).toBe(
      false,
    );
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

    expect(state.isSwitchingServer).toBe(
      true,
    );

    state = reducer(state, {
      type: switchServer.fulfilled.type,
    });

    expect(state.isSwitchingServer).toBe(
      false,
    );

    state = reducer(state, {
      type: switchServer.rejected.type,
    });

    expect(state.isSwitchingServer).toBe(
      false,
    );
  });
});

describe("concurrent JWT storage writes", () => {
  it("preserves tokens for two servers when writes overlap", async () => {
    const storage = new Map<string, string>();
    let firstRead = true;

    const getSpy = jest.spyOn(AsyncStorage, "getItem").mockImplementation(
      async (key) => {
        const value = storage.get(key) ?? null;

        if (key === jwtByServerKey && firstRead) {
          firstRead = false;
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        }

        return value;
      },
    );

    const setSpy = jest.spyOn(AsyncStorage, "setItem").mockImplementation(
      async (key, value) => {
        storage.set(key, value);
      },
    );

    try {
      await Promise.all([
        setJwtForServer("http://localhost:8080", "token-A"),
        setJwtForServer("http://localhost:9090", "token-B"),
      ]);

      const saved = await loadJwtByServer();

      expect(saved["http://localhost:8080"]).toBe("token-A");
      expect(saved["http://localhost:9090"]).toBe("token-B");
    } finally {
      getSpy.mockRestore();
      setSpy.mockRestore();
    }
  });
});
