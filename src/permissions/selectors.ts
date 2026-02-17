// src/permissions/selectors.ts

import { RootState } from "../redux/store";
import { PERMISSIONS } from "./PermiossionGroup";

export const selectPermissionItems = (state: RootState) => {
  const values = state.dataPermissions.values;

  return PERMISSIONS.map((p) => ({
    ...p,
    value: values[p.id] ?? p.defaultValue,
  }));
};

export const selectAllAccepted = (state: RootState) => {
  const values = state.dataPermissions.values;

  return PERMISSIONS.filter((p) => p.editable).every(
    (p) => values[p.id] === true
  );
};
