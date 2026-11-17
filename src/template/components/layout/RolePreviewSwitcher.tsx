import { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  Dropdown,
} from "@design-system";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  ROLE_LABELS,
  type AssignedUserRole,
} from "@/template/authorization/roles";

import {
  selectAssignedRole,
  selectCanPreviewRoles,
  selectRolePreview,
  setRolePreview,
} from "@/template/state/authorization/authorizationSlice";


const roleOptions:
  Record<
    AssignedUserRole,
    string
  > = {
    ADMIN:
      ROLE_LABELS.ADMIN,

    USER:
      ROLE_LABELS.USER,

    EDITOR:
      ROLE_LABELS.EDITOR,
  };


const ROLE_PREVIEW_KEY = "web-template:role-preview:v1";

export function RolePreviewSwitcher() {
  const dispatch =
    useAppDispatch();

  const [restored, setRestored] = useState(false);

  const assignedRole =
    useAppSelector(
      selectAssignedRole,
    );

  const previewRole =
    useAppSelector(
      selectRolePreview,
    );

  const canPreviewRoles =
    useAppSelector(
      selectCanPreviewRoles,
    );

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== "web") {
      setRestored(true);
      return;
    }

    try {
      if (canPreviewRoles) {
        const saved = window.localStorage.getItem(ROLE_PREVIEW_KEY);

        if (saved === "USER" || saved === "EDITOR") {
          dispatch(setRolePreview(saved));
        }
      } else {
        window.localStorage.removeItem(ROLE_PREVIEW_KEY);
      }
    } catch {
      // Storage unavailable: continue without persistence.
    }

    setRestored(true);
  }, [canPreviewRoles, dispatch]);

  if (!canPreviewRoles || !restored) {
    return null;
  }

  const value:
    AssignedUserRole =
      previewRole ??
      assignedRole;

  return (
    <Dropdown<AssignedUserRole>
      value={value}
      options={roleOptions}
      onChange={(nextRole) => {
        if (__DEV__ && Platform.OS === "web") {
          try {
            if (nextRole === "ADMIN") {
              window.localStorage.removeItem(ROLE_PREVIEW_KEY);
            } else {
              window.localStorage.setItem(
                ROLE_PREVIEW_KEY,
                nextRole,
              );
            }
          } catch {
            // Storage unavailable: role preview still works.
          }
        }

        dispatch(
          setRolePreview(
            nextRole === "ADMIN" ? null : nextRole,
          ),
        );
      }}
      size="md"
      appearance="menu"
      menuWidth={50}
    />
  );
}
