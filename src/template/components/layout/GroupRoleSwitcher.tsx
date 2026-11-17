import { Dropdown } from "@design-system";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectAvailableGroupRoles,
  selectGroupMenuRole,
} from "@/template/state/authorization/selectGroupMenuRole";

import {
  selectGroupRole,
  selectPublicGroupView,
} from "@/template/state/authorization/groupRolesSlice";

/**
 * Group-menu preview only.
 * Does not grant or modify backend permissions.
 */
export function GroupRoleSwitcher() {
  const dispatch = useAppDispatch();

  const roles = useAppSelector(
    selectAvailableGroupRoles,
  );

  const selected = useAppSelector(
    selectGroupMenuRole,
  );

  if (roles.length === 0) {
    return null;
  }

  const options: Record<string, string> = {
    "": "Öffentlich",
  };

  for (const role of roles) {
    options[role] = role;
  }

  return (
    <Dropdown<string>
      value={selected ?? ""}
      options={options}
      onChange={(role) => {
        if (role === "") {
          dispatch(selectPublicGroupView());
        } else if (roles.includes(role)) {
          dispatch(selectGroupRole(role));
        }
      }}
      size="sm"
      appearance="menu"
      menuWidth={170}
      triggerWidth={116}
    />
  );
}
