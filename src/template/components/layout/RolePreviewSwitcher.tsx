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
    superAdmin:
      ROLE_LABELS.superAdmin,

    user:
      ROLE_LABELS.user,

    frontendEditor:
      ROLE_LABELS.frontendEditor,

    backendEditor:
      ROLE_LABELS.backendEditor,
  };


export function RolePreviewSwitcher() {
  const dispatch =
    useAppDispatch();

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

  if (
    !canPreviewRoles
  ) {
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
        dispatch(
          setRolePreview(
            nextRole ===
              "superAdmin"
              ? null
              : nextRole,
          ),
        );
      }}
      size="sm"
      appearance="menu"
      menuWidth={180}
    />
  );
}