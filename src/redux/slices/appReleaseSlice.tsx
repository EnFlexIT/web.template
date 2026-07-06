import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type WebAppReleaseType = "PRODUCTION_RELEASE" | "TEST_RELEASE" | "UNKNOWN";

const STORAGE_KEY = "webAppReleaseType";

function normalizeReleaseType(value: unknown): WebAppReleaseType {
  if (value === "TEST_RELEASE") return "TEST_RELEASE";
  if (value === "PRODUCTION_RELEASE") return "PRODUCTION_RELEASE";
  return "UNKNOWN";
}

function loadStoredReleaseType(): WebAppReleaseType {
  if (typeof window === "undefined") return "UNKNOWN";
  return normalizeReleaseType(window.localStorage.getItem(STORAGE_KEY));
}

function saveReleaseType(value: WebAppReleaseType) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
}

const appReleaseSlice = createSlice({
  name: "appRelease",
  initialState: {
    webAppReleaseType: loadStoredReleaseType(),
  },
  reducers: {
    setWebAppReleaseType(state, action: PayloadAction<unknown>) {
      const releaseType = normalizeReleaseType(action.payload);

      // Wichtig: UNKNOWN darf gespeichertes TEST_RELEASE nicht überschreiben.
      if (releaseType === "UNKNOWN") return;

      state.webAppReleaseType = releaseType;
      saveReleaseType(releaseType);
    },
  },
});

export const { setWebAppReleaseType } = appReleaseSlice.actions;

export const selectIsTestRelease = (state: RootState) =>
  state.appRelease.webAppReleaseType === "TEST_RELEASE";

export default appReleaseSlice.reducer;