import {
  createBackendMenuV2,
} from "./createBackendMenuV2";

type CreateParams =
  Parameters<typeof createBackendMenuV2>[0];

type CreateContext =
  ReturnType<CreateParams["getContext"]>;

export interface BackendMenuCreateSubmitParams {
  caption: string;
  parentId: number;
  language: string;
  allowedRoles: readonly string[];
  expectedContext: CreateContext;

  getContext: CreateParams["getContext"];

  getAvailableRoles: () => readonly string[];
  getLanguage: () => string;
  isDialogCurrent: () => boolean;
  canAssignRoles: () => boolean;

  refreshMenus: () => Promise<void>;
}

export async function submitBackendMenuCreateV2(
  params: BackendMenuCreateSubmitParams,
): Promise<void> {
  const expected = { ...params.expectedContext };
  const roles = [...new Set(params.allowedRoles)];

  function assertCurrent(): CreateContext {
    const current = params.getContext();

    if (
      !params.isDialogCurrent() ||
      current.client !== expected.client ||
      current.server !== expected.server ||
      current.authGeneration !== expected.authGeneration ||
      params.getLanguage() !== params.language ||
      !current.isLoggedIn ||
      current.isLoggingOut ||
      current.isSwitchingServer
    ) {
      throw new Error("create.sessionChanged");
    }

    if (
      !current.canEdit ||
      !params.canAssignRoles()
    ) {
      throw new Error("create.permissionDenied");
    }

    const available = params.getAvailableRoles();

    if (
      roles.length === 0 ||
      roles.some(role =>
        typeof role !== "string" ||
        !role.trim() ||
        !available.includes(role),
      )
    ) {
      throw new Error("create.invalidRoles");
    }

    return current;
  }

  if (
    !Number.isSafeInteger(params.parentId) ||
    params.parentId <= 0
  ) {
    throw new Error("create.invalidParent");
  }

  assertCurrent();

  try {
    await createBackendMenuV2({
      caption: params.caption,
      parentId: params.parentId,
      language: params.language,
      allowedRoles: roles,
      getContext: assertCurrent,
    });
  } catch (error) {
    // The request may already have reached the server.
    // Refresh only if the original context remains valid.
    // Never retry the write automatically.
    try {
      assertCurrent();
      await params.refreshMenus();
    } catch {
      // Preserve the original failure.
    }

    throw error;
  }

  assertCurrent();

  try {
    await params.refreshMenus();
  } catch {
    throw new Error("create.refreshFailed");
  }

  assertCurrent();
}
