import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "../store";

export type DeveloperConsolePlacement =
  | "bottom"
  | "right";

export type DeveloperConsoleState = {
  isOpen: boolean;
  placement: DeveloperConsolePlacement;
};

export const DEVELOPER_CONSOLE_STORAGE_KEY =
  "webTemplate.developerConsole";

const fallbackState: DeveloperConsoleState = {
  isOpen: false,
  placement: "bottom",
};

function loadInitialState(): DeveloperConsoleState {
  if (
    typeof window === "undefined" ||
    !window.localStorage
  ) {
    return fallbackState;
  }

  try {
    const rawValue =
      window.localStorage.getItem(
        DEVELOPER_CONSOLE_STORAGE_KEY,
      );

    if (!rawValue) {
      return fallbackState;
    }

    const parsed = JSON.parse(
      rawValue,
    ) as Partial<DeveloperConsoleState>;

    return {
      isOpen: parsed.isOpen === true,
      placement:
        parsed.placement === "right"
          ? "right"
          : "bottom",
    };
  } catch {
    return fallbackState;
  }
}

const initialState =
  loadInitialState();

const developerConsoleSlice =
  createSlice({
    name: "developerConsole",
    initialState,

    reducers: {
      openDeveloperConsole(state) {
        state.isOpen = true;
      },

      closeDeveloperConsole(state) {
        state.isOpen = false;
      },

      toggleDeveloperConsole(state) {
        state.isOpen = !state.isOpen;
      },

      dockDeveloperConsole(
        state,
        action: PayloadAction<DeveloperConsolePlacement>,
      ) {
        state.placement = action.payload;
        state.isOpen = true;
      },
    },
  });

export const {
  openDeveloperConsole,
  closeDeveloperConsole,
  toggleDeveloperConsole,
  dockDeveloperConsole,
} = developerConsoleSlice.actions;

export default developerConsoleSlice.reducer;

export const selectDeveloperConsole = (
  state: RootState,
) => state.developerConsole;

export function persistDeveloperConsoleState(
  state: DeveloperConsoleState,
): void {
  if (
    typeof window === "undefined" ||
    !window.localStorage
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      DEVELOPER_CONSOLE_STORAGE_KEY,
      JSON.stringify({
        isOpen: state.isOpen,
        placement: state.placement,
      }),
    );
  } catch {
    // Fehlender LocalStorage darf die Anwendung
    // nicht beeinträchtigen.
  }
}