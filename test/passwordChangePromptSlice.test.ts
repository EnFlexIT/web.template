/// <reference types="jest" />

import reducer, {
  openInitialPasswordChangeDialog,
  closeInitialPasswordChangeDialog,
} from "../src/redux/slices/passwordChangePromptSlice";

describe("passwordChangePromptSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.isOpen).toBe(false);
  });

  it("should open initial password change dialog", () => {
    const state = reducer(
      undefined,
      openInitialPasswordChangeDialog(),
    );

    expect(state.isOpen).toBe(true);
  });

  it("should close initial password change dialog", () => {
    let state = reducer(
      undefined,
      openInitialPasswordChangeDialog(),
    );

    state = reducer(
      state,
      closeInitialPasswordChangeDialog(),
    );

    expect(state.isOpen).toBe(false);
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/passwordChangePromptSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux passwordChangePromptSlice isoliert
 * ohne echte UI.
 *
 * Fokus:
 * - Dialog Open State
 * - Dialog Close State
 * - Reducer Verhalten
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - Dialog öffnet nicht
 * - Dialog schließt nicht
 * - falsche Password Change Zustände
 * - fehlerhafte Reducer Updates
 * - inkonsistente UI States
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Dialog Open Tests
 * 3. Dialog Close Tests
 *
 * ============================================================
 * UI FEATURES COVERED
 * ============================================================
 * - Initial Password Change Dialog
 * - Password Change Prompt State
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Password-Dialog-Logik,
 * damit der Initial Password Change Workflow
 * stabil funktioniert.
 * ============================================================
 */