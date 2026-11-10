import {
  configureStore,
} from "@reduxjs/toolkit";

import backendRolesReducer, {
  backendRolesReset,
} from "../src/template/state/authorization/backendRolesSlice";

import {
  fetchBackendRoles,
} from "../src/template/state/authorization/fetchBackendRoles";

type Deferred = {
  promise: Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
};

function deferred(): Deferred {
  let resolve!: Deferred["resolve"];
  let reject!: Deferred["reject"];

  const promise = new Promise<any>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createTestStore(
  getUserRoles: jest.Mock,
  loggedIn = true,
) {
  const apiState = {
    isLoggedIn: loggedIn,
    ip: "https://server-a.example",
    jwt: "jwt-a" as string | null,
    authenticationMethod: "jwt",
    awb_rest_api: {
      userApi: {
        getUserRoles,
      },
    },
  };

  const apiReducer = (
    state = apiState,
    action: {
      type: string;
      payload?: unknown;
    },
  ) => {
    if (action.type === "test/logout") {
      return {
        ...state,
        isLoggedIn: false,
        jwt: null,
      };
    }

    if (action.type === "test/serverChange") {
      return {
        ...state,
        ip: "https://server-b.example",
      };
    }

    return state;
  };

  return configureStore({
    reducer: {
      api: apiReducer,
      backendRoles: backendRolesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["api.awb_rest_api"],
        },
      }),
  });
}

describe("fetchBackendRoles", () => {
  it("does not fetch roles when logged out", async () => {
    const getUserRoles = jest.fn();
    const store = createTestStore(getUserRoles, false);

    await store.dispatch(fetchBackendRoles() as any);

    expect(getUserRoles).not.toHaveBeenCalled();
    expect(store.getState().backendRoles.status).toBe("idle");
  });

  it("stores a successful roles response", async () => {
    const getUserRoles = jest.fn().mockResolvedValue({
      data: ["USER", "EDITOR"],
    });

    const store = createTestStore(getUserRoles);

    await store.dispatch(fetchBackendRoles() as any);

    expect(getUserRoles).toHaveBeenCalledTimes(1);
    expect(store.getState().backendRoles.status).toBe("ready");
    expect(store.getState().backendRoles.roles).toEqual([
      "USER",
      "EDITOR",
    ]);
  });

  it("rejects invalid backend responses", async () => {
    const getUserRoles = jest.fn().mockResolvedValue({
      data: ["USER", 123],
    });

    const store = createTestStore(getUserRoles);

    await store.dispatch(fetchBackendRoles() as any);

    expect(store.getState().backendRoles.status).toBe("error");
    expect(store.getState().backendRoles.roles).toEqual([]);
  });

  it("does not store roles after logout and reset", async () => {
    const pending = deferred();
    const getUserRoles = jest.fn().mockReturnValue(pending.promise);
    const store = createTestStore(getUserRoles);

    const request = store.dispatch(fetchBackendRoles() as any);

    store.dispatch({ type: "test/logout" });
    store.dispatch(backendRolesReset());

    pending.resolve({ data: ["ADMIN"] });
    await request;

    expect(store.getState().backendRoles.status).toBe("idle");
    expect(store.getState().backendRoles.roles).toEqual([]);
  });

  it("ignores a response after server change", async () => {
    const pending = deferred();
    const getUserRoles = jest.fn().mockReturnValue(pending.promise);
    const store = createTestStore(getUserRoles);

    const request = store.dispatch(fetchBackendRoles() as any);

    store.dispatch({ type: "test/serverChange" });

    pending.resolve({ data: ["ADMIN"] });
    await request;

    expect(store.getState().backendRoles.roles).toEqual([]);
  });

  it("stores API failures without granting roles", async () => {
    const getUserRoles = jest.fn().mockRejectedValue(
      new Error("Network error"),
    );

    const store = createTestStore(getUserRoles);

    await store.dispatch(fetchBackendRoles() as any);

    expect(store.getState().backendRoles.status).toBe("error");
    expect(store.getState().backendRoles.roles).toEqual([]);
    expect(store.getState().backendRoles.error).toBe(
      "Network error",
    );
  });
});