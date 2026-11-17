import type {
  MenuItem,
  MenuList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

export interface LoadBackendMenusForEditorParams {
  getState: () => TemplateRootState;
}

function validateMenuItems(items: MenuItem[]): MenuItem[] {
  const ids = new Set<number>();

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.menuId) ||
      item.menuId <= 0 ||
      !Number.isSafeInteger(item.position) ||
      item.position < 0 ||
      typeof item.caption !== "string" ||
      item.caption.trim().length === 0 ||
      typeof item.isHeadMenu !== "boolean" ||
      ids.has(item.menuId)
    ) {
      throw new Error("Invalid backend menu inventory");
    }

    if (
      item.parentId !== undefined &&
      item.parentId !== null &&
      (!Number.isSafeInteger(item.parentId) ||
        item.parentId <= 0 ||
        item.parentId === item.menuId)
    ) {
      throw new Error("Invalid backend menu parent");
    }

    ids.add(item.menuId);
  }

  return items.map(item => ({ ...item }));
}

/**
 * Loads the real backend menu inventory for the menu editor.
 *
 * Does not use the merged runtime navigation.
 * Does not write to the backend or modify Redux.
 */
export async function loadBackendMenusForEditorV2({
  getState,
}: LoadBackendMenusForEditorParams): Promise<MenuItem[]> {
  const before = getState().api;

  if (
    !before.isLoggedIn ||
    before.isLoggingOut ||
    before.isSwitchingServer ||
    !before.ip?.trim() ||
    !Number.isSafeInteger(before.authGeneration)
  ) {
    throw new Error("Backend menu loading is not authorized");
  }

  const client = before.dynamic_content_api_v2?.defaultApi;

  if (!client || typeof client.getMenus !== "function") {
    throw new Error("Backend menu API is unavailable");
  }

  const server = before.ip;
  const generation = before.authGeneration;

  const language = getState().language?.language;

  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Backend menu language is unavailable");
  }

  const response = await client.getMenus(language);

  const after = getState().api;

  if (
    !after.isLoggedIn ||
    after.isLoggingOut ||
    after.isSwitchingServer ||
    after.ip !== server ||
    after.authGeneration !== generation ||
    after.dynamic_content_api_v2?.defaultApi !== client
  ) {
    throw new Error("Backend menu response belongs to a stale session");
  }

  const data: MenuList = response.data;

  if (
    !data ||
    !Array.isArray(data.menuList)
  ) {
    throw new Error("Invalid backend menu response");
  }

  return validateMenuItems(data.menuList);
}
