import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "../store";

export type DeveloperConsolePlacement =
  | "bottom"
  | "right";

export type DeveloperConsoleState = {
  /**
   * Steuert, ob die komplette Developer Console
   * inklusive Launcher-Leiste sichtbar ist.
   */
  isVisible: boolean;

  /**
   * Steuert, ob das eigentliche Panel geöffnet ist.
   * Bei false bleibt normalerweise nur die Leiste sichtbar.
   */
  isOpen: boolean;

  placement: DeveloperConsolePlacement;
};

const initialState: DeveloperConsoleState = {
  isVisible: true,
  isOpen: false,
  placement: "bottom",
};

const developerConsoleSlice = createSlice({
  name: "developerConsole",
  initialState,
  reducers: {
    /**
     * Öffnet das Panel an der zuletzt gewählten Position.
     */
    openDeveloperConsole(state) {
      state.isVisible = true;
      state.isOpen = true;
    },

    /**
     * Minimiert das Panel.
     * Die untere Launcher-Leiste bleibt sichtbar.
     */
    closeDeveloperConsole(state) {
      state.isVisible = true;
      state.isOpen = false;
    },

    /**
     * Blendet die komplette Developer Console aus.
     * Auch die Launcher-Leiste verschwindet.
     */
    hideDeveloperConsole(state) {
      state.isVisible = false;
      state.isOpen = false;
    },

    /**
     * Funktioniert auch, wenn die Konsole komplett
     * ausgeblendet wurde.
     */
    toggleDeveloperConsole(state) {
      if (!state.isVisible) {
        state.isVisible = true;
        state.isOpen = true;
        return;
      }

      state.isOpen = !state.isOpen;
    },

    /**
     * Position auswählen und Panel direkt öffnen.
     *
     * Dadurch kann eine ausgeblendete Konsole über
     * den normalen Live-Console-Screen zurückgeholt werden.
     */
    dockDeveloperConsole(
      state,
      action: PayloadAction<DeveloperConsolePlacement>,
    ) {
      state.isVisible = true;
      state.isOpen = true;
      state.placement = action.payload;
    },
  },
});

export const {
  openDeveloperConsole,
  closeDeveloperConsole,
  hideDeveloperConsole,
  toggleDeveloperConsole,
  dockDeveloperConsole,
} = developerConsoleSlice.actions;

export default developerConsoleSlice.reducer;

export const selectDeveloperConsole = (
  state: RootState,
) => state.developerConsole;