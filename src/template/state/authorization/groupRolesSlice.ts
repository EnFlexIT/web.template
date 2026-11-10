import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export type GroupRolesStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export interface GroupRolesState {
  status: GroupRolesStatus;
  roles: string[];
  selectedGroupRole: string | null;
  requestId: string | null;
  error: string | null;
}

export const initialGroupRolesState: GroupRolesState = {
  status: "idle",
  roles: [],
  selectedGroupRole: null,
  requestId: null,
  error: null,
};

const resetActionTypes = new Set([
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

const slice = createSlice({
  name: "groupRoles",
  initialState: initialGroupRolesState,
  reducers: {
    groupRolesRequested(
      state,
      action: PayloadAction<string>,
    ) {
      state.status = "loading";
      state.roles = [];
      state.selectedGroupRole = null;
      state.requestId = action.payload;
      state.error = null;
    },

    groupRolesReceived(
      state,
      action: PayloadAction<{
        requestId: string;
        roles: string[];
      }>,
    ) {
      if (
        state.status !== "loading" ||
        state.requestId !== action.payload.requestId
      ) {
        return;
      }

      const roles = [
        ...new Set(
          action.payload.roles.filter(role => role.trim() !== ""),
        ),
      ];

      state.status = "ready";
      state.roles = roles;
      state.selectedGroupRole = null;
      state.requestId = null;
      state.error = null;
    },

    groupRolesFailed(
      state,
      action: PayloadAction<{
        requestId: string;
        error: string;
      }>,
    ) {
      if (
        state.status !== "loading" ||
        state.requestId !== action.payload.requestId
      ) {
        return;
      }

      state.status = "error";
      state.roles = [];
      state.selectedGroupRole = null;
      state.requestId = null;
      state.error = action.payload.error;
    },

    selectGroupRole(
      state,
      action: PayloadAction<string>,
    ) {
      if (
        state.status === "ready" &&
        state.roles.includes(action.payload)
      ) {
        state.selectedGroupRole = action.payload;
      }
    },

    selectPublicGroupView(state) {
      state.selectedGroupRole = null;
    },

    resetGroupRoles() {
      return initialGroupRolesState;
    },
  },

  extraReducers: builder => {
    builder.addMatcher(
      action => resetActionTypes.has(action.type),
      () => initialGroupRolesState,
    );
  },
});

export const {
  groupRolesRequested,
  groupRolesReceived,
  groupRolesFailed,
  selectGroupRole,
  selectPublicGroupView,
  resetGroupRoles,
} = slice.actions;

export default slice.reducer;
