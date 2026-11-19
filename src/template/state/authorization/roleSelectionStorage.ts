import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "web-template:unified-role-selection:v1";

export type StoredBackendRole = "USER" | "EDITOR" | "ADMIN";

export interface StoredRoleSelection {
  identity: string;
  backendRole: StoredBackendRole;
  groupRole: string | null;
}

export interface RoleSelectionSession {
  server: string;
  authenticationMethod: string;
  jwt: string | null;
}

export function getRoleSelectionIdentity(
  session: RoleSelectionSession,
): string | null {
  if (!session.jwt || !session.server) {
    return null;
  }

  try {
    const decoded = jwtDecode<{ sub?: unknown }>(session.jwt);

    if (
      typeof decoded.sub !== "string" ||
      decoded.sub.length === 0
    ) {
      return null;
    }

    return JSON.stringify([
      session.server,
      session.authenticationMethod,
      decoded.sub,
    ]);
  } catch {
    return null;
  }
}

export function readRoleSelection(
  identity: string | null,
): StoredRoleSelection | null {
  if (!identity || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const value = parsed as Partial<StoredRoleSelection>;

    if (value.identity !== identity) {
      return null;
    }

    if (
      value.backendRole !== "USER" &&
      value.backendRole !== "EDITOR" &&
      value.backendRole !== "ADMIN"
    ) {
      return null;
    }

    if (
      value.groupRole !== null &&
      typeof value.groupRole !== "string"
    ) {
      return null;
    }

    return value as StoredRoleSelection;
  } catch {
    return null;
  }
}

export function saveRoleSelection(
  identity: string | null,
  changes: Partial<
    Pick<StoredRoleSelection, "backendRole" | "groupRole">
  >,
): void {
  if (!identity || typeof window === "undefined") {
    return;
  }

  try {
    const previous = readRoleSelection(identity);

    const selection: StoredRoleSelection = {
      identity,
      backendRole: changes.backendRole ?? previous?.backendRole ?? "USER",
      groupRole:
        changes.groupRole !== undefined
          ? changes.groupRole
          : previous?.groupRole ?? null,
    };

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(selection),
    );
  } catch {
    // Storage may be unavailable.
  }
}

export function clearRoleSelection(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }
}
