import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import type {
  AssignedUserRole,
  EffectiveUserRole,
  RolePreview,
} from "@/template/authorization/roles";


type AuthorizationState = {
  /**
   * Real Base Template role assigned to the
   * authenticated user.
   *
   * Temporary frontend fallback:
   * The backend does not provide the final role yet.
   */
  assignedRole: AssignedUserRole;

  /**
   * Optional role simulation available only to ADMIN.
   *
   * null means that ADMIN operates with its own
   * permissions.
   */
  previewRole: RolePreview;
};


const initialState:
  AuthorizationState = {
    /*
     * Temporary demo value until the backend exposes
     * the authenticated user's real Base Template role.
     */
    assignedRole: "ADMIN",

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
          PayloadAction<
            AssignedUserRole
          >,
      ) => {
        state.assignedRole =
          action.payload;

        /*
         * Role preview is available only to ADMIN.
         */
        if (
          action.payload !==
          "ADMIN"
        ) {
          state.previewRole =
            null;
        }
      },

      setRolePreview: (
        state,
        action:
          PayloadAction<
            RolePreview
          >,
      ) => {
        if (
          state.assignedRole !==
          "ADMIN"
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
  "ADMIN";


const EFFECTIVE_ROLE_SETS:
  Readonly<
    Record<
      EffectiveUserRole,
      readonly EffectiveUserRole[]
    >
  > = {
    USER: ["USER"],
    EDITOR: ["EDITOR"],
    ADMIN: ["ADMIN"],
  };


export const selectEffectiveRoles = (
  state: TemplateRootState,
): readonly EffectiveUserRole[] => {
  const {
    assignedRole,
    previewRole,
  } = state.authorization;

  const effectiveRole =
    assignedRole === "ADMIN" &&
    previewRole
      ? previewRole
      : assignedRole;

  return EFFECTIVE_ROLE_SETS[
    effectiveRole
  ];
};

export default
  authorizationSlice.reducer;
