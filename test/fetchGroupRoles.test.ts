import { configureStore } from "@reduxjs/toolkit";

import groupRolesReducer, {
  selectGroupRole,
} from "../src/template/state/authorization/groupRolesSlice";

import {
  fetchGroupRoles,
} from "../src/template/state/authorization/fetchGroupRoles";

type Deferred = {
  promise: Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
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
  getGroupRoles: jest.Mock,
  loggedIn = true,
) {
  const initialApi = {
    isLoggedIn: loggedIn,
    isPointingToServer: true,
    isSwitchingServer: false,
    isLoggingOut: false,
    ip: "https://server-a.example",
    jwt: "jwt-a" as string | null,
    authenticationMethod: "jwt",
    awb_rest_api: {
      userApi: {
        getGroupRoles,
      },
    },
  };

  const apiReducer = (
    state = initialApi,
    action: { type: string },
  ) => {
    switch (action.type) {
      case "api/logoutLocal":
        return {
          ...state,
          isLoggedIn: false,
          jwt: null,
        };

      case "api/switchServer/pending":
        return {
          ...state,
          ip: "https://server-b.example",
          isSwitchingServer: true,
        };

      case "api/setJwtLocal":
        return {
          ...state,
          jwt: "jwt-b",
        };

      case "test/disconnect":
        return {
          ...state,
          isPointingToServer: false,
        };

      default:
        return state;
    }
  };

  return configureStore({
    reducer: {
      api: apiReducer,
      groupRoles: groupRolesReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["api.awb_rest_api"],
        },
      }),
  });
}

describe("fetchGroupRoles", () => {
  it("does not request roles when logged out", async () => {
    const getGroupRoles = jest.fn();
    const store = createTestStore(getGroupRoles, false);

    await store.dispatch(fetchGroupRoles() as any);

    expect(getGroupRoles).not.toHaveBeenCalled();
    expect(store.getState().groupRoles.status).toBe("idle");
  });

  it("does not request roles without a server", async () => {
    const getGroupRoles = jest.fn();
    const store = createTestStore(getGroupRoles);

    store.dispatch({ type: "test/disconnect" });
    await store.dispatch(fetchGroupRoles() as any);

    expect(getGroupRoles).not.toHaveBeenCalled();
    expect(store.getState().groupRoles.roles).toEqual([]);
  });

  it("stores confirmed group roles", async () => {
    const getGroupRoles = jest.fn().mockResolvedValue({
      data: ["Vermieter", "Mieter"],
    });

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(getGroupRoles).toHaveBeenCalledTimes(1);
    expect(store.getState().groupRoles).toMatchObject({
      status: "ready",
      roles: ["Vermieter", "Mieter"],
      selectedGroupRole: null,
      error: null,
    });
  });

  it("accepts an empty group-role response", async () => {
    const getGroupRoles = jest.fn().mockResolvedValue({
      data: [],
    });

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(store.getState().groupRoles.status).toBe("ready");
    expect(store.getState().groupRoles.roles).toEqual([]);
  });

  it("rejects malformed backend responses", async () => {
    const getGroupRoles = jest.fn().mockResolvedValue({
      data: ["Vermieter", 123],
    });

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(store.getState().groupRoles.status).toBe("error");
    expect(store.getState().groupRoles.roles).toEqual([]);
    expect(store.getState().groupRoles.error).toBe(
      "Invalid group roles response",
    );
  });

  it("rejects non-array backend responses", async () => {
    const getGroupRoles = jest.fn().mockResolvedValue({
      data: { roles: ["Vermieter"] },
    });

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(store.getState().groupRoles.status).toBe("error");
    expect(store.getState().groupRoles.roles).toEqual([]);
  });

  it("does not grant roles after a network failure", async () => {
    const getGroupRoles = jest.fn().mockRejectedValue(
      new Error("Network error"),
    );

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(store.getState().groupRoles.status).toBe("error");
    expect(store.getState().groupRoles.roles).toEqual([]);
    expect(store.getState().groupRoles.error).toBe(
      "Network error",
    );
  });

  it("ignores a pending response after logout", async () => {
    const pending = deferred();
    const getGroupRoles = jest.fn().mockReturnValue(pending.promise);
    const store = createTestStore(getGroupRoles);

    const request = store.dispatch(fetchGroupRoles() as any);

    store.dispatch({ type: "api/logoutLocal" });

    pending.resolve({ data: ["Vermieter"] });
    await request;

    expect(store.getState().groupRoles.status).toBe("idle");
    expect(store.getState().groupRoles.roles).toEqual([]);
    expect(store.getState().groupRoles.selectedGroupRole).toBeNull();
  });

  it("ignores a pending response after server switch", async () => {
    const pending = deferred();
    const getGroupRoles = jest.fn().mockReturnValue(pending.promise);
    const store = createTestStore(getGroupRoles);

    const request = store.dispatch(fetchGroupRoles() as any);

    store.dispatch({ type: "api/switchServer/pending" });

    pending.resolve({ data: ["Vermieter"] });
    await request;

    expect(store.getState().groupRoles.status).toBe("idle");
    expect(store.getState().groupRoles.roles).toEqual([]);
  });

  it("ignores a pending response after JWT change", async () => {
    const pending = deferred();
    const getGroupRoles = jest.fn().mockReturnValue(pending.promise);
    const store = createTestStore(getGroupRoles);

    const request = store.dispatch(fetchGroupRoles() as any);

    store.dispatch({ type: "api/setJwtLocal" });

    pending.resolve({ data: ["Vermieter"] });
    await request;

    expect(store.getState().groupRoles.status).toBe("idle");
    expect(store.getState().groupRoles.roles).toEqual([]);
  });

  it("ignores stale responses after a newer request", async () => {
    const first = deferred();
    const second = deferred();

    const getGroupRoles = jest.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const store = createTestStore(getGroupRoles);

    const oldRequest = store.dispatch(fetchGroupRoles() as any);
    const newRequest = store.dispatch(fetchGroupRoles() as any);

    first.resolve({ data: ["AlteGruppe"] });
    await oldRequest;

    expect(store.getState().groupRoles.status).toBe("loading");
    expect(store.getState().groupRoles.roles).toEqual([]);

    second.resolve({ data: ["Vermieter"] });
    await newRequest;

    expect(store.getState().groupRoles.status).toBe("ready");
    expect(store.getState().groupRoles.roles).toEqual(["Vermieter"]);
  });

  it("does not turn a group into a selected permission", async () => {
    const getGroupRoles = jest.fn().mockResolvedValue({
      data: ["Vermieter"],
    });

    const store = createTestStore(getGroupRoles);

    await store.dispatch(fetchGroupRoles() as any);

    expect(store.getState().groupRoles.selectedGroupRole).toBeNull();

    store.dispatch(selectGroupRole("NichtZugewiesen"));

    expect(store.getState().groupRoles.selectedGroupRole).toBeNull();

    store.dispatch(selectGroupRole("Vermieter"));

    expect(store.getState().groupRoles.selectedGroupRole).toBe(
      "Vermieter",
    );
  });
});
