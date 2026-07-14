/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("i18next", () => ({
  changeLanguage: jest.fn(),
}));

jest.mock("../redux/slices/menuSlice", () => ({
  updateMenu: () => ({ type: "menu/update" }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18next from "i18next";

import reducer, {
  LanguageState,
  internalSetLanguage,
  initializeLanguage,
} from "../src/redux/slices/languageSlice";

describe("languageSlice", () => {
  const initialState: LanguageState = {
    language: "de",
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

  it("should set language internally", () => {
    const state = reducer(
      initialState,
      internalSetLanguage({
        language: "en",
      }),
    );

    expect(state.language).toBe("en");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("lng", "en");
    expect(i18next.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("should handle initializeLanguage.fulfilled with stored language", () => {
    const state = reducer(initialState, {
      type: initializeLanguage.fulfilled.type,
      payload: "en",
    });

    expect(state.language).toBe("en");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("lng", "en");
    expect(i18next.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("should handle initializeLanguage.fulfilled with default language", () => {
    const state = reducer(initialState, {
      type: initializeLanguage.fulfilled.type,
      payload: "de",
    });

    expect(state.language).toBe("de");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("lng", "de");
    expect(i18next.changeLanguage).toHaveBeenCalledWith("de");
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/languageSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux languageSlice isoliert ohne echte React UI
 * und ohne echte App-Navigation.
 *
 * Fokus:
 * - Initial Language State
 * - Sprache intern setzen
 * - Sprache aus Initialisierung übernehmen
 * - AsyncStorage Speicherung
 * - i18next Sprachwechsel
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falsche Default-Sprache
 * - verlorene Spracheinstellung
 * - fehlerhafte AsyncStorage-Speicherung
 * - fehlenden i18next.changeLanguage Aufruf
 * - inkonsistenten Redux Language State
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. initializeLanguage fulfilled Tests
 * 4. AsyncStorage Side Effect Tests
 * 5. i18next Side Effect Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * Keine direkten Backend-Features.
 *
 * Der Slice verwaltet ausschließlich die lokale
 * Spracheinstellung der Anwendung.
 *
 * ============================================================
 * MOCKED DEPENDENCIES
 * ============================================================
 * - AsyncStorage
 * - i18next
 * - menuSlice.updateMenu
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Sprachlogik,
 * damit Spracheinstellung, Speicherung und
 * UI-Sprachwechsel stabil funktionieren.
 * ============================================================
 */