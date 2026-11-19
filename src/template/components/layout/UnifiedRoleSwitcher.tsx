import { useEffect } from "react";

import { Dropdown } from "@design-system";

import {
  getRoleSelectionIdentity,
  readRoleSelection,
  saveRoleSelection,
  type StoredBackendRole,
} from "@/template/state/authorization/roleSelectionStorage";

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

import {
  selectAvailableGroupRoles,
  selectGroupMenuRole,
} from "@/template/state/authorization/selectGroupMenuRole";

import {
  selectGroupRole,
  selectPublicGroupView,
} from "@/template/state/authorization/groupRolesSlice";

import {
  ROLE_LABELS,
} from "@/template/authorization/roles";

/**
 * Combines two independent UI preview selections.
 *
 * Backend roles and group roles retain separate state.
 * Neither selection grants backend permissions.
 */
export function UnifiedRoleSwitcher() {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(
    state => state.api.isLoggedIn,
  );

  const server = useAppSelector(
    state => state.api.ip,
  );

  const authenticationMethod = useAppSelector(
    state => state.api.authenticationMethod,
  );

  const jwt = useAppSelector(
    state => state.api.jwt,
  );

  const identity = isLoggedIn
    ? getRoleSelectionIdentity({
        server,
        authenticationMethod,
        jwt,
      })
    : null;

  const backendRoles = useAppSelector(
    selectVerifiedBackendRoles,
  );

  const backendRole = useAppSelector(
    selectUiPreviewMode,
  );

  const backendStatus = useAppSelector(
    state => state.backendRoles.status,
  );

  const pendingBackendRole = useAppSelector(
    state => state.backendRoles.previewRoleToRestore,
  );

  const groupRoles = useAppSelector(
    selectAvailableGroupRoles,
  );

  const groupRole = useAppSelector(
    selectGroupMenuRole,
  );

  const groupStatus = useAppSelector(
    state => state.groupRoles.status,
  );

  /**
   * Restore the backend preview only after roles
   * have been confirmed by the backend.
   */
  useEffect(() => {
    if (!identity || backendStatus !== "ready") {
      return;
    }

    const saved = readRoleSelection(identity);

    if (!saved) {
      return;
    }

    const role = saved.backendRole;

    const allowed =
      role === "USER" ||
      backendRoles.includes(role);

    if (allowed && backendRole !== role) {
      dispatch(setBackendPreviewRole(role));
    }
  }, [
    identity,
    backendStatus,
    backendRoles,
    backendRole,
    dispatch,
  ]);

  /**
   * Restore the group preview only after the
   * confirmed group roles have been received.
   */
  useEffect(() => {
    if (!identity || groupStatus !== "ready") {
      return;
    }

    const saved = readRoleSelection(identity);

    if (!saved) {
      return;
    }

    const role = saved.groupRole;

    if (role === null) {
      if (groupRole !== null) {
        dispatch(selectPublicGroupView());
      }

      return;
    }

    if (
      groupRoles.includes(role) &&
      groupRole !== role
    ) {
      dispatch(selectGroupRole(role));
    }
  }, [
    identity,
    groupStatus,
    groupRoles,
    groupRole,
    dispatch,
  ]);

  const options: Record<string, string> = {};
  const disabledOptions: string[] = [];

  const backendHeading = "heading:backend";

  options[backendHeading] = "BACKEND-ROLLEN";
  disabledOptions.push(backendHeading);

  if (backendStatus === "ready") {
    const availableBackendRoles = [
      "USER",
      "EDITOR",
      "ADMIN",
    ].filter(
      role =>
        role === "USER" ||
        backendRoles.includes(role),
    );

    for (const role of availableBackendRoles) {
      const key = `backend:${role}`;
      const label =
        ROLE_LABELS[role as keyof typeof ROLE_LABELS];

      options[key] =
        `${backendRole === role ? "✓ " : "   "}${label}`;
    }
  } else {
    const key = "status:backend";

    options[key] =
      backendStatus === "error"
        ? "Rollen nicht verfügbar"
        : pendingBackendRole
          ? "Rollen werden geprüft ..."
          : "Rollen werden geladen ...";

    disabledOptions.push(key);
  }

  if (groupRoles.length > 0) {
    const groupHeading = "heading:group";

    options[groupHeading] = "GRUPPENROLLEN";
    disabledOptions.push(groupHeading);

    options["group:public"] =
      `${groupRole === null ? "✓ " : "   "}Öffentlich`;

    groupRoles.forEach((role, index) => {
      options[`group:${index}`] =
        `${groupRole === role ? "✓ " : "   "}${role}`;
    });
  }

  const backendLabel =
    backendStatus === "ready"
      ? ROLE_LABELS[backendRole]
      : backendStatus === "error"
        ? "Rollen nicht verfügbar"
        : "Rollen werden geprüft";

  const groupLabel =
    groupRoles.length > 0
      ? groupRole ?? "Öffentlich"
      : null;

  const triggerLabel = groupLabel
    ? `${backendLabel} · ${groupLabel}`
    : backendLabel;

  return (
    <Dropdown<string>
      value="__combined_role_selector__"
      options={options}
      disabledOptions={disabledOptions}
      triggerLabel={triggerLabel}
      onChange={key => {
        if (key.startsWith("backend:")) {
          const role = key.slice("backend:".length);

          if (
            backendStatus === "ready" &&
            (
              role === "USER" ||
              backendRoles.includes(role)
            )
          ) {
            saveRoleSelection(identity, {
              backendRole: role as StoredBackendRole,
            });

            dispatch(setBackendPreviewRole(role));
          }

          return;
        }

        if (key === "group:public") {
          if (groupRoles.length > 0) {
            saveRoleSelection(identity, {
              groupRole: null,
            });

            dispatch(selectPublicGroupView());
          }
          return;
        }

        if (key.startsWith("group:")) {
          const index = Number(key.slice("group:".length));

          if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < groupRoles.length
          ) {
            saveRoleSelection(identity, {
              groupRole: groupRoles[index],
            });

            dispatch(selectGroupRole(groupRoles[index]));
          }
        }
      }}
      size="sm"
      appearance="menu"
      menuWidth={240}
      triggerWidth={175}
      maxMenuHeight={360}
    />
  );
}
