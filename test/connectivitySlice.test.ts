/// <reference types="jest" />

jest.mock("../redux/slices/apiSlice", () => ({
  normalizeBaseUrl: (url: string) => String(url ?? "").trim().replace(/\/+$/, ""),
  selectIp: (state: any) => state.api.ip,
}));

import reducer, {
  dismissBackOnline,
  setOfflineLocal,
  checkAlive,
} from "../src/redux/slices/connectivitySlice";

describe("connectivitySlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.isOffline).toBe(false);
    expect(state.showBackOnline).toBe(false);
    expect(state.checking).toBe(false);
    expect(state.lastError).toBeNull();
  });

  it("should dismiss back online notification", () => {
    const currentState = {
      isOffline: false,
      showBackOnline: true,
      checking: false,
      lastError: null,
    };

    const state = reducer(currentState, dismissBackOnline());

    expect(state.showBackOnline).toBe(false);
  });

  it("should set offline local with error", () => {
    const state = reducer(
      undefined,
      setOfflineLocal({
        error: "Server nicht erreichbar.",
      }),
    );

    expect(state.isOffline).toBe(true);
    expect(state.lastError).toBe("Server nicht erreichbar.");
    expect(state.showBackOnline).toBe(false);
  });

  it("should set offline local without error", () => {
    const state = reducer(
      undefined,
      setOfflineLocal({}),
    );

    expect(state.isOffline).toBe(true);
    expect(state.lastError).toBeNull();
    expect(state.showBackOnline).toBe(false);
  });

  it("should handle checkAlive.pending", () => {
    const state = reducer(undefined, {
      type: checkAlive.pending.type,
    });

    expect(state.checking).toBe(true);
  });

  it("should handle checkAlive.fulfilled when skipped", () => {
    const currentState = {
      isOffline: true,
      showBackOnline: false,
      checking: true,
      lastError: "Old error",
    };

    const state = reducer(currentState, {
      type: checkAlive.fulfilled.type,
      payload: {
        isOnline: false,
        wentOnline: false,
        error: null,
        skipped: true,
        checkedUrl: null,
        checkedStatus: undefined,
      },
    });

    expect(state.checking).toBe(false);
    expect(state.isOffline).toBe(true);
    expect(state.lastError).toBe("Old error");
  });

  it("should handle checkAlive.fulfilled when server is online", () => {
    const currentState = {
      isOffline: false,
      showBackOnline: false,
      checking: true,
      lastError: "Old error",
    };

    const state = reducer(currentState, {
      type: checkAlive.fulfilled.type,
      payload: {
        isOnline: true,
        wentOnline: false,
        error: null,
        skipped: false,
        checkedUrl: "http://localhost:8080/api/alive",
        checkedStatus: 200,
      },
    });

    expect(state.checking).toBe(false);
    expect(state.isOffline).toBe(false);
    expect(state.lastError).toBeNull();
    expect(state.showBackOnline).toBe(false);
  });

  it("should show back online when server was offline before", () => {
    const currentState = {
      isOffline: true,
      showBackOnline: false,
      checking: true,
      lastError: "Server nicht erreichbar.",
    };

    const state = reducer(currentState, {
      type: checkAlive.fulfilled.type,
      payload: {
        isOnline: true,
        wentOnline: true,
        error: null,
        skipped: false,
        checkedUrl: "http://localhost:8080/api/alive",
        checkedStatus: 200,
      },
    });

    expect(state.checking).toBe(false);
    expect(state.isOffline).toBe(false);
    expect(state.showBackOnline).toBe(true);
    expect(state.lastError).toBeNull();
  });

  it("should handle checkAlive.fulfilled when server is offline", () => {
    const state = reducer(undefined, {
      type: checkAlive.fulfilled.type,
      payload: {
        isOnline: false,
        wentOnline: false,
        error: "Server nicht erreichbar.",
        skipped: false,
        checkedUrl: "http://localhost:8080/api/alive",
        checkedStatus: undefined,
      },
    });

    expect(state.checking).toBe(false);
    expect(state.isOffline).toBe(true);
    expect(state.showBackOnline).toBe(false);
    expect(state.lastError).toBe("Server nicht erreichbar.");
  });

  it("should handle checkAlive.rejected", () => {
    const state = reducer(undefined, {
      type: checkAlive.rejected.type,
      error: {
        message: "Request failed",
      },
    });

    expect(state.checking).toBe(false);
    expect(state.isOffline).toBe(true);
    expect(state.showBackOnline).toBe(false);
    expect(state.lastError).toBe("Request failed");
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/connectivitySlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux connectivitySlice isoliert ohne echte
 * Netzwerkverbindung und ohne echte API.
 *
 * Fokus:
 * - Online / Offline State
 * - Server-Erreichbarkeit
 * - Back-Online Hinweis
 * - Checking State
 * - Fehlerstatus
 * - checkAlive Lifecycle
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falsche Offline-Anzeige
 * - verlorene Fehlermeldungen
 * - kaputte Back-Online Benachrichtigung
 * - fehlerhafte Checking States
 * - falsches Verhalten bei Serverwechsel
 * - inkonsistente Connectivity States
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. Offline State Tests
 * 4. Back-Online Notification Tests
 * 5. checkAlive pending Tests
 * 6. checkAlive fulfilled Tests
 * 7. checkAlive rejected Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * - /api/alive
 * - Server Connectivity
 * - Server Online/Offline Status
 *
 * ============================================================
 * MOCKED DEPENDENCIES
 * ============================================================
 * - apiSlice.normalizeBaseUrl
 * - apiSlice.selectIp
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Connectivity-Logik,
 * damit Netzwerkstatus, Offline-Anzeige und
 * Back-Online-Verhalten stabil funktionieren.
 * ============================================================
 */