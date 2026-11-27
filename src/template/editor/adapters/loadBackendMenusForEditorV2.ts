import type {
  MenuItem,
  MenuList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectVerifiedBackendRoles,
} from "@/template/state/authorization/selectVerifiedBackendRoles";

import {
  canEditLocalContent,
} from "@/template/editor/authorization/canEditLocalContent";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

export interface LoadBackendMenusForEditorParams {
  getState: () => TemplateRootState;
}

function canReadInventory(state: TemplateRootState): boolean {
  const api = state.api;

  return (
    api.isLoggedIn &&
    !api.isLoggingOut &&
    !api.isSwitchingServer &&
    Boolean(api.ip?.trim()) &&
    Number.isSafeInteger(api.authGeneration) &&
    canEditLocalContent(selectVerifiedBackendRoles(state))
  );
}

function validateMenuItems(items: MenuItem[]): MenuItem[] {
  const ids = new Set<number>();

  for (const item of items) {
    if (
      !item ||
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

  const result = items.map(item => ({ ...item }));

  // A complete inventory must contain a valid hierarchy.
  buildBackendMenuTreeV2(result);

  return result;
}

/**
 * Loads the complete editor-only backend menu inventory.
 *
 * Never falls back to role-filtered runtime navigation.
 * Does not modify Redux or write backend data.
 */
export async function loadBackendMenusForEditorV2({
  getState,
}: LoadBackendMenusForEditorParams): Promise<MenuItem[]> {
  const state = getState();
  const before = state.api;

  if (!canReadInventory(state)) {
    throw new Error("Backend menu loading is not authorized");
  }

  const client = before.dynamic_content_api_v2?.defaultApi;

  if (!client || typeof client.getAllMenus !== "function") {
    throw new Error("Complete backend menu API is unavailable");
  }

  const server = before.ip;
  const generation = before.authGeneration;
  const language = state.language?.language;

  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Backend menu language is unavailable");
  }

  const response = await client.getAllMenus(language);

  const current = getState();
  const after = current.api;

  if (
    !canReadInventory(current) ||
    after.ip !== server ||
    after.authGeneration !== generation ||
    after.dynamic_content_api_v2?.defaultApi !== client ||
    current.language?.language !== language
  ) {
    throw new Error("Backend menu response belongs to a stale session");
  }

  const data: MenuList = response.data;

  if (!data || !Array.isArray(data.menuList)) {
    throw new Error("Invalid backend menu response");
  }

  return validateMenuItems(data.menuList);
}
