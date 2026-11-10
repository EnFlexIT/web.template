import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  canPreviewTemplateRole,
  type EffectiveTemplateRole,
  type TemplateRole,
} from "./templateRolePermissions";

export interface TemplateRolePreviewState {
  enabled: boolean;
  actualRole: TemplateRole | null;
  selectedPreviewRole: EffectiveTemplateRole | null;
}

export const initialTemplateRolePreviewState: TemplateRolePreviewState = {
  enabled: false,
  actualRole: null,
  selectedPreviewRole: null,
};

const slice = createSlice({
  name: "templateRolePreview",
  initialState: initialTemplateRolePreviewState,
  reducers: {
    startTemplateRolePreview(state, action: PayloadAction<TemplateRole>) {
      state.enabled = true;
      state.actualRole = action.payload;
      state.selectedPreviewRole =
        action.payload === "superAdmin" ? "user" : action.payload;
    },
    setTemplatePreviewRole(
      state,
      action: PayloadAction<EffectiveTemplateRole>,
    ) {
      if (
        state.enabled &&
        state.actualRole !== null &&
        canPreviewTemplateRole(state.actualRole, action.payload)
      ) {
        state.selectedPreviewRole = action.payload;
      }
    },
    stopTemplateRolePreview() {
      return initialTemplateRolePreviewState;
    },
  },
  extraReducers: builder => {
    const resetActions = new Set([
      "api/initialize/pending",
      "api/setIpAsync/pending",
      "api/switchServer/pending",
      "api/login/pending",
      "api/logoutLocal",
      "api/logoutAsync/pending",
      "api/setConnectionLocal",
      "api/setJwtLocal",
      "api/resetAuthAfterConfigurationChange/pending",
    ]);
    builder.addMatcher(
      action => resetActions.has(action.type),
      () => initialTemplateRolePreviewState,
    );
  },
});

export const {
  startTemplateRolePreview,
  setTemplatePreviewRole,
  stopTemplateRolePreview,
} = slice.actions;

export default slice.reducer;