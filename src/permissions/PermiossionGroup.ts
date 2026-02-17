// src/permissions/permissionCatalog.ts

export type PermissionId = number;

export type PermissionDefinition = {
  id: PermissionId;
  titleKey: string;        
  descriptionKey: string;  
  defaultValue: boolean;
  editable: boolean;
};

export const PERMISSIONS: PermissionDefinition[] = [
  {
    id: 1,
    titleKey: "permissions.mandatory.title",
    descriptionKey: "permissions.mandatory.description",
    defaultValue: true,
    editable: false,
  },
  {
    id: 2,
    titleKey: "permissions.statistics.title",
    descriptionKey: "permissions.statistics.description",
    defaultValue: false,
    editable: true,
  },
  {
    id: 3,
    titleKey: "permissions.comfort.title",
    descriptionKey: "permissions.comfort.description",
    defaultValue: false,
    editable: true,
  },
  {
    id: 4,
    titleKey: "permissions.personalised.title",
    descriptionKey: "permissions.personalised.description",
    defaultValue: false,
    editable: true,
  },
];

export const DEFAULT_PERMISSION_VALUES: Record<PermissionId, boolean> =
  PERMISSIONS.reduce<Record<PermissionId, boolean>>((acc, p) => {
    acc[p.id] = p.defaultValue;
    return acc;
  }, {});
