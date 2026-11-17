import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export type BackendRolesStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export interface BackendRolesState {
  status: BackendRolesStatus;
  roles: string[];
  selectedPreviewRole: string | null;
  previewRoleToRestore: string | null;
  error: string | null;
  requestId: string | null;
  sessionKey: string | null;
}

const initialState: BackendRolesState = {
  status: "idle",
  roles: [],
  selectedPreviewRole: null,
  previewRoleToRestore: null,
  error: null,
  requestId: null,
  sessionKey: null,
};

const backendRolesSlice = createSlice({
  name: "backendRoles",
  initialState,
  reducers: {
    setBackendPreviewRole(
      state,
      action: PayloadAction<string>,
    ) {
      if (
        state.status !== "ready" ||
        (
          action.payload !== "USER" &&
          (
            !["EDITOR", "ADMIN"].includes(action.payload) ||
            !state.roles.includes(action.payload)
          )
        )
      ) {
        return;
      }

      state.selectedPreviewRole = action.payload === "USER" ? null : action.payload;
      state.previewRoleToRestore = null;
    },
    backendRolesRequested(
      state,
      action: PayloadAction<{
        requestId: string;
        sessionKey: string;
      }>,
    ) {
      state.status = "loading";
      state.selectedPreviewRole = null;
      state.roles = [];
      state.error = null;
      state.requestId = action.payload.requestId;
      state.sessionKey = action.payload.sessionKey;
    },

    backendRolesReceived(
      state,
      action: PayloadAction<{
        requestId: string;
        sessionKey: string;
        roles: string[];
      }>,
    ) {
      if (
        state.requestId !== action.payload.requestId ||
        state.sessionKey !== action.payload.sessionKey
      ) {
        return;
      }

      state.status = "ready";
      state.roles = action.payload.roles;

      const requestedPreview = state.previewRoleToRestore;

      state.selectedPreviewRole =
        requestedPreview !== null &&
        (requestedPreview === "EDITOR" || requestedPreview === "ADMIN") &&
        state.roles.includes(requestedPreview)
          ? requestedPreview
          : null;

      state.previewRoleToRestore = null;
      state.error = null;
    },

    backendRolesFailed(
      state,
      action: PayloadAction<{
        requestId: string;
        sessionKey: string;
        error: string;
      }>,
    ) {
      if (
        state.requestId !== action.payload.requestId ||
        state.sessionKey !== action.payload.sessionKey
      ) {
        return;
      }

      state.status = "error";
      state.selectedPreviewRole = null;
      state.roles = [];
      state.error = action.payload.error;
    },

    backendRolesReset() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    const resetActions = new Set([
      "api/initialize/pending",
      "api/setIpAsync/pending",
      "api/switchServer/pending",
      "api/login/pending",
      "api/setConnectionLocal",

      "api/logoutLocal",
      "api/logoutAsync/pending",
      "api/resetAuthAfterConfigurationChange/pending",
    ]);

    builder.addMatcher(
      (action) => resetActions.has(action.type),
      () => initialState,
    );

    // JWT rotation invalidates verified roles, but keeps the requested
    // preview dormant until the backend confirms it again.
    builder.addMatcher(
      (action) => action.type === "api/setJwtLocal",
      (state) => {
        const requestedPreview =
          state.status === "ready"
            ? state.selectedPreviewRole
            : state.previewRoleToRestore;

        return {
          ...initialState,
          previewRoleToRestore: requestedPreview,
        };
      },
    );
  },
});

export const {
  setBackendPreviewRole,
  backendRolesRequested,
  backendRolesReceived,
  backendRolesFailed,
  backendRolesReset,
} = backendRolesSlice.actions;

export default backendRolesSlice.reducer;