import { Dropdown } from "@design-system";
import { Text } from "react-native";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  setBackendPreviewRole,
} from "@/template/state/authorization/backendRolesSlice";

import {
  selectUiPreviewMode,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectVerifiedBackendRoles,
} from "@/template/state/authorization/selectVerifiedBackendRoles";

export function BackendRoleSwitcher() {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectVerifiedBackendRoles);
  const mode = useAppSelector(selectUiPreviewMode);

  const status = useAppSelector(
    state => state.backendRoles.status,
  );

  const pendingRole = useAppSelector(
    state => state.backendRoles.previewRoleToRestore,
  );

  // Verified roles are temporarily unavailable during JWT rotation.
  // Do not display the public USER perspective as a selected role
  // while a previously selected role is being revalidated.
  if (status !== "ready") {
    const label =
      status === "error"
        ? "Rollen nicht verfuegbar"
        : pendingRole === "EDITOR" || pendingRole === "ADMIN"
          ? "Rollen werden geprueft..."
          : "Rollen werden geladen...";

    return (
      <Text accessibilityRole="text" accessibilityLabel={label}>
        {label}
      </Text>
    );
  }

  const options: Record<string, string> = {
    USER: "USER",
  };

  if (roles.includes("EDITOR")) {
    options.EDITOR = "EDITOR";
  }

  if (roles.includes("ADMIN")) {
    options.ADMIN = "ADMIN";
  }

  return (
    <Dropdown<string>
      value={mode}
      options={options}
      onChange={(role) => dispatch(setBackendPreviewRole(role))}
      size="sm"
      appearance="menu"
      menuWidth={150}
      triggerWidth={88}
    />
  );
}
