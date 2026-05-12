/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-unistyles", () => ({
  UnistylesRuntime: {
    setAdaptiveThemes: jest.fn(),
    setTheme: jest.fn(),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

import { UnistylesRuntime } from "react-native-unistyles";

import reducer, {
  ThemeState,
  setTheme,
  setThemeState,
  initializeTheme,
} from "../redux/slices/themeSlice";

describe("themeSlice", () => {
  const initialState: ThemeState = {
    val: {
      adaptive: true,
      theme: "light",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the initial state", () => {
    const state = reducer(undefined, {
      type: "unknown",
    });

    expect(state).toEqual(initialState);
  });

  it("should set theme", () => {
    const state = reducer(
      initialState,
      setTheme({
        adaptive: false,
        theme: "dark",
      }),
    );

    expect(state.val.adaptive).toBe(false);
    expect(state.val.theme).toBe("dark");

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "color",
      JSON.stringify({
        adaptive: false,
        theme: "dark",
      }),
    );

    expect(UnistylesRuntime.setAdaptiveThemes).toHaveBeenCalled();
    expect(UnistylesRuntime.setTheme).toHaveBeenCalledWith("dark");
  });

  it("should set theme state", () => {
    const state = reducer(
      initialState,
      setThemeState({
        val: {
          adaptive: false,
          theme: "dark",
        },
      }),
    );

    expect(state.val.adaptive).toBe(false);
    expect(state.val.theme).toBe("dark");
  });

  it("should handle initializeTheme.fulfilled", () => {
    const state = reducer(initialState, {
      type: initializeTheme.fulfilled.type,
      payload: {
        adaptive: false,
        theme: "dark",
      },
    });

    expect(state.val.adaptive).toBe(false);
    expect(state.val.theme).toBe("dark");

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "color",
      JSON.stringify({
        adaptive: false,
        theme: "dark",
      }),
    );

    expect(UnistylesRuntime.setAdaptiveThemes).toHaveBeenCalled();
    expect(UnistylesRuntime.setTheme).toHaveBeenCalledWith("dark");
  });

  it("should fallback to default theme on invalid payload", () => {
    const state = reducer(initialState, {
      type: initializeTheme.fulfilled.type,
      payload: {},
    });

    expect(state.val.adaptive).toBe(true);
    expect(state.val.theme).toBe("light");
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/themeSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux themeSlice isoliert ohne echte React UI
 * und ohne echte Unistyles Runtime.
 *
 * Fokus:
 * - Theme State
 * - Theme Speicherung
 * - Theme Initialisierung
 * - Adaptive Themes
 * - Unistyles Theme Updates
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falsches Theme
 * - verlorene Theme-Einstellungen
 * - fehlerhafte Theme-Speicherung
 * - kaputte Dark-/Light-Mode Umschaltung
 * - ungültige Theme-Zustände
 * - fehlerhafte Unistyles-Aufrufe
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. Theme Update Tests
 * 4. initializeTheme fulfilled Tests
 * 5. AsyncStorage Side Effect Tests
 * 6. Unistyles Runtime Tests
 * 7. Default Fallback Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * Keine direkten Backend-Features.
 *
 * Der Slice verwaltet ausschließlich das lokale
 * Theme und die UI-Darstellung.
 *
 * ============================================================
 * MOCKED DEPENDENCIES
 * ============================================================
 * - AsyncStorage
 * - react-native-unistyles
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Theme-Logik,
 * damit Dark Mode, Light Mode und adaptive
 * Themes stabil funktionieren.
 * ============================================================
 */