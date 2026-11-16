jest.mock("../src/core/server/runtimeBaseUrl", () => ({
  resolveRuntimeBaseUrl: () => null,
}));
import apiReducer, {
  setIpAsync,
  switchServer,
} from "../src/template/state/api/apiSlice";

describe("API connection switching status", () => {
  const initial = apiReducer(undefined, {
    type: "@@INIT",
  });

  it("starts without an active server switch", () => {
    expect(initial.isSwitchingServer).toBe(false);
  });

  it("tracks setIpAsync pending and fulfilled", () => {
    const pending = apiReducer(
      initial,
      setIpAsync.pending("request-1", "https://server.example"),
    );

    expect(pending.isSwitchingServer).toBe(true);

    const fulfilled = apiReducer(
      pending,
      setIpAsync.fulfilled(
        {
          ip: "https://server.example",
          isPointingToServer: true,
          authenticationMethod: "jwt",
          isBaseMode: false,
        },
        "request-1",
        "https://server.example",
      ),
    );

    expect(fulfilled.isSwitchingServer).toBe(false);
  });

  it("clears switching status if setIpAsync fails", () => {
    const pending = apiReducer(
      initial,
      setIpAsync.pending("request-2", "https://server.example"),
    );

    const rejected = apiReducer(
      pending,
      setIpAsync.rejected(
        new Error("Network failure"),
        "request-2",
        "https://server.example",
      ),
    );

    expect(rejected.isSwitchingServer).toBe(false);
  });

  it("continues tracking switchServer", () => {
    const pending = apiReducer(
      initial,
      switchServer.pending("request-3", "https://server.example"),
    );

    expect(pending.isSwitchingServer).toBe(true);

    const fulfilled = apiReducer(
      pending,
      switchServer.fulfilled(
        undefined,
        "request-3",
        "https://server.example",
      ),
    );

    expect(fulfilled.isSwitchingServer).toBe(false);
  });
});
describe("Configuration auth reset status", () => {
  it("blocks role synchronization while auth reset is pending", () => {
    const start = apiReducer(undefined, { type: "@@INIT" });

    const pending = apiReducer(start, {
      type: "api/resetAuthAfterConfigurationChange/pending",
    });

    expect(pending.isLoggingOut).toBe(true);

    const completed = apiReducer(pending, {
      type: "api/resetAuthAfterConfigurationChange/fulfilled",
    });

    expect(completed.isLoggingOut).toBe(false);

    const rejected = apiReducer(pending, {
      type: "api/resetAuthAfterConfigurationChange/rejected",
    });

    expect(rejected.isLoggingOut).toBe(false);
  });
});

describe("Authentication generation lifecycle", () => {
  it("starts at zero", () => {
    const state = apiReducer(undefined, { type: "@@INIT" });
    expect(state.authGeneration).toBe(0);
  });

  it.each([
    "api/initialize/pending",
    "api/login/pending",
    "api/logoutAsync/pending",
    "api/switchServer/pending",
    "api/setIpAsync/pending",
    "api/resetAuthAfterConfigurationChange/pending",
    "api/logoutLocal",
  ])("increments on %s", (type) => {
    const initial = apiReducer(undefined, { type: "@@INIT" });
    const updated = apiReducer(initial, { type });

    expect(updated.authGeneration).toBe(1);
  });

  it("increments on setConnectionLocal", () => {
    const initial = apiReducer(undefined, { type: "@@INIT" });

    const updated = apiReducer(initial, {
      type: "api/setConnectionLocal",
      payload: {
        ip: "https://server.example",
        jwt: null,
        isPointingToServer: true,
        authenticationMethod: "jwt",
        isBaseMode: false,
        authenticated: false,
      },
    });

    expect(updated.authGeneration).toBe(1);
  });

  it("does not increment on a normal JWT update", () => {
    const initial = apiReducer(undefined, { type: "@@INIT" });

    const updated = apiReducer(initial, {
      type: "api/setJwtLocal",
      payload: null,
    });

    expect(updated.authGeneration).toBe(0);
  });

  it("does not reset generation after initialize fulfilled", () => {
    const initial = apiReducer(undefined, { type: "@@INIT" });

    const pending = apiReducer(initial, {
      type: "api/initialize/pending",
    });

    const completed = apiReducer(pending, {
      type: "api/initialize/fulfilled",
      payload: {
        ...initial,
        authGeneration: 0,
      },
    });

    expect(completed.authGeneration).toBe(1);
  });
});
