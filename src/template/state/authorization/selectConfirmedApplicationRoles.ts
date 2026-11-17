import type {
  EffectiveUserRole,
} from "@/template/authorization/roles";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectVerifiedBackendRoles,
} from "./selectVerifiedBackendRoles";

/**
 * Backend-confirmed roles used by legacy Application
 * menu and tab configuration.
 *
 * Group roles are separate and must never grant
 * administrative access through this selector.
 */
export function selectConfirmedApplicationRoles(
  state: TemplateRootState,
): readonly EffectiveUserRole[] {
  return selectVerifiedBackendRoles(state).filter(
    (role): role is EffectiveUserRole =>
      role === "USER" ||
      role === "EDITOR" ||
      role === "ADMIN",
  );
}