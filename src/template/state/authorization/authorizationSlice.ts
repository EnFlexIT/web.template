import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  SUPER_ADMIN_ROLES,
  type AssignedUserRole,
  type EffectiveUserRole,
  type RolePreview,
} from "@/template/authorization/roles";


type AuthorizationState = {
  /**
   * Real role assigned to the authenticated user.
   *
   * Temporary frontend fallback:
   * The backend does not provide the final role yet.
   */
  assignedRole: AssignedUserRole;

  /**
   * Optional role simulation used only by Super Admin.
   *
   * null means that the Super Admin operates with the
   * combined permissions of all effective roles.
   */
  previewRole: RolePreview;
};


const initialState: AuthorizationState = {
  /*
   * Temporary demo value until the backend exposes
   * the authenticated user's real role.
   */
  assignedRole: "superAdmin",

  previewRole: null,
};


const authorizationSlice =
  createSlice({
    name: "authorization",

    initialState,

    reducers: {
      setAssignedRole: (
        state,
        action:
          PayloadAction<AssignedUserRole>,
      ) => {
        state.assignedRole =
          action.payload;

        /*
         * Role preview is valid only while the
         * authenticated user is a Super Admin.
         */
        if (
          action.payload !==
          "superAdmin"
        ) {
          state.previewRole =
            null;
        }
      },

      setRolePreview: (
        state,
        action:
          PayloadAction<RolePreview>,
      ) => {
        if (
          state.assignedRole !==
          "superAdmin"
        ) {
          state.previewRole =
            null;

          return;
        }

        state.previewRole =
          action.payload;
      },

      clearRolePreview: (
        state,
      ) => {
        state.previewRole =
          null;
      },
    },
  });


export const {
  setAssignedRole,
  setRolePreview,
  clearRolePreview,
} =
  authorizationSlice.actions;


export const selectAssignedRole = (
  state: TemplateRootState,
) =>
  state.authorization
    .assignedRole;


export const selectRolePreview = (
  state: TemplateRootState,
) =>
  state.authorization
    .previewRole;


export const selectCanPreviewRoles = (
  state: TemplateRootState,
) =>
  state.authorization
    .assignedRole ===
  "superAdmin";


export const selectEffectiveRoles = (
  state: TemplateRootState,
): readonly EffectiveUserRole[] => {
  const {
    assignedRole,
    previewRole,
  } =
    state.authorization;

  if (
    assignedRole ===
    "superAdmin"
  ) {
    if (previewRole) {
      return [
        previewRole,
      ];
    }

    return SUPER_ADMIN_ROLES;
  }

  return [
    assignedRole,
  ];
};


export default
  authorizationSlice.reducer;