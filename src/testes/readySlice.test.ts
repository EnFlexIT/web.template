

import reducer, {
  ReadyState,
  setReady,
} from "../redux/slices/readySlice";

describe("readySlice", () => {
  const initialState: ReadyState = {
    ready: false,
  };

  it("should return the initial state", () => {
    const state = reducer(undefined, {
      type: "unknown",
    });

    expect(state).toEqual(initialState);
  });

  it("should set ready to true", () => {
    const state = reducer(
      initialState,
      setReady(true),
    );

    expect(state.ready).toBe(true);
  });

  it("should set ready to false", () => {
    const currentState: ReadyState = {
      ready: true,
    };

    const state = reducer(
      currentState,
      setReady(false),
    );

    expect(state.ready).toBe(false);
  });
});
/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/readySlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux readySlice isoliert ohne React UI
 * und ohne Backend.
 *
 * Fokus:
 * - Ready State
 * - Reducer
 * - setReady Action
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falschen Ready-State
 * - fehlerhafte Initialisierung
 * - kaputte Reducer-Updates
 * - inkonsistente App-Bereitschaft
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. Ready State Update Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * Keine direkten Backend-Features.
 *
 * Der Slice steuert ausschließlich den lokalen
 * Redux Ready-State der Anwendung.
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Ready-State-Logik,
 * damit Initialisierung und App-Status
 * stabil funktionieren.
 * ============================================================
 */