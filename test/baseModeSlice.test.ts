/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import reducer, {
  setBaseModeLoggedIn,
  logoutBaseMode,
} from "../src/redux/slices/baseModeSlice";

describe("baseModeSlice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.baseModeLoggedIn).toBe(false);
  });

  it("should set base mode logged in", () => {
    const state = reducer(undefined, setBaseModeLoggedIn(true));

    expect(state.baseModeLoggedIn).toBe(true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "baseModeLoggedIn",
      "true",
    );
  });

  it("should remove storage entry when base mode is disabled", () => {
    const state = reducer(undefined, setBaseModeLoggedIn(false));

    expect(state.baseModeLoggedIn).toBe(false);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "baseModeLoggedIn",
    );
  });

  it("should logout base mode", () => {
    let state = reducer(undefined, setBaseModeLoggedIn(true));

    state = reducer(state, logoutBaseMode());

    expect(state.baseModeLoggedIn).toBe(false);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "baseModeLoggedIn",
    );
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/baseModeSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux baseModeSlice isoliert ohne echte UI
 * und ohne echtes AsyncStorage.
 *
 * Fokus:
 * - Base Mode Login Status
 * - Reducer
 * - AsyncStorage Speicherung
 * - Logout Verhalten
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - verlorenen BaseMode Login Status
 * - fehlerhafte Logout-Zustände
 * - kaputte AsyncStorage Speicherung
 * - inkonsistente baseMode States
 * - fehlerhafte Reducer Updates
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. AsyncStorage Tests
 * 4. Logout Tests
 *
 * ============================================================
 * STORAGE FEATURES COVERED
 * ============================================================
 * - baseModeLoggedIn
 * - AsyncStorage.setItem
 * - AsyncStorage.removeItem
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der BaseMode-Logik,
 * damit Login/Logout Verhalten stabil bleibt
 * und Refactoring keine versteckten Fehler erzeugt.
 * ============================================================
 */