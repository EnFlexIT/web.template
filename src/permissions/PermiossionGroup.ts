// src/permissions/permissionCatalog.ts

export type PermissionId = 1 | 2 | 3 | 4;

export type PermissionDefinition = {
  id: PermissionId;
  title: string;
  description: string;
  defaultValue: boolean;
};

export const PERMISSIONS: PermissionDefinition[] = [
  {
    id: 1,
    title: "Notwendige",
    description: "Erforderlich für den Betrieb der App (z. B. Login, Sicherheit, Speicherung).",
    defaultValue: true,
  },
  {
    id: 2,
    title: "Statistik",
    description: "Hilft uns zu verstehen, welche Funktionen genutzt werden, um die App zu verbessern.",
    defaultValue: false,
  },
  {
    id: 3,
    title: "Komfort",
    description: "Verbessert die Nutzererfahrung (z. B. Spracheinstellungen, Komfortfunktionen).",
    defaultValue: false,
  },
  {
    id: 4,
    title: "Personalisierung",
    description: "Personalisierte Inhalte und Empfehlungen basierend auf Nutzung und Einstellungen.",
    defaultValue: false,
  },
];

export const DEFAULT_PERMISSION_VALUES: Record<PermissionId, boolean> =
  PERMISSIONS.reduce((acc, p) => {
    acc[p.id] = p.defaultValue;
    return acc;
  }, {} as Record<PermissionId, boolean>);
