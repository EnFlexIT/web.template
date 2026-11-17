import type {
  MenuItem,
  MenuList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export interface BackendMenuRenameClient {
  getMenus(
    lang?: string,
  ): Promise<{ data: MenuList }>;

  updateMenu(
    menuId: number,
    menuItem: MenuItem,
  ): Promise<unknown>;
}

export interface BackendMenuRenameContext {
  client: BackendMenuRenameClient;
  server: string;
  authGeneration: number;
  isLoggedIn: boolean;
  canEdit: boolean;
  isSwitchingServer: boolean;
  isLoggingOut: boolean;
}

export interface RenameBackendMenuParams {
  menuId: number;
  caption: string;
  language: string;
  getContext: () => BackendMenuRenameContext;
}

function isWritable(
  context: BackendMenuRenameContext,
): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    typeof context.server === "string" &&
    context.server.trim().length > 0 &&
    Number.isSafeInteger(context.authGeneration)
  );
}

function isSameSession(
  before: BackendMenuRenameContext,
  after: BackendMenuRenameContext,
): boolean {
  return (
    before.client === after.client &&
    before.server === after.server &&
    before.authGeneration === after.authGeneration &&
    isWritable(after)
  );
}

export async function renameBackendMenuV2({
  menuId,
  caption,
  language,
  getContext,
}: RenameBackendMenuParams): Promise<void> {
  if (!Number.isSafeInteger(menuId) || menuId <= 0) {
    throw new Error("Invalid backend menu ID");
  }

  if (typeof caption !== "string" || !caption.trim()) {
    throw new Error("Backend menu caption is required");
  }

  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Backend menu language is required");
  }

  const before = { ...getContext() };

  if (!isWritable(before)) {
    throw new Error("Backend menu editing is not authorized");
  }

  const response = await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu inventory belongs to a stale session");
  }

  const items = response.data?.menuList;

  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const matches = items.filter(item => item.menuId === menuId);

  if (matches.length !== 1) {
    throw new Error("Backend menu ID not uniquely found");
  }

  const current = matches[0];

  if (
    !current ||
    !Number.isSafeInteger(current.position) ||
    current.position < 0 ||
    typeof current.caption !== "string" ||
    typeof current.isHeadMenu !== "boolean"
  ) {
    throw new Error("Invalid backend menu item");
  }

  const next: MenuItem = {
    ...current,
    caption: caption.trim(),
  };

  if (next.caption === current.caption) {
    return;
  }

  // Immediately recheck before initiating the write.
  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu session changed before update");
  }

  await before.client.updateMenu(menuId, next);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu update returned for a stale session");
  }
}