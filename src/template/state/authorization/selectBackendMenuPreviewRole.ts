import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectGroupMenuRole,
} from "./selectGroupMenuRole";

/**
 * Only a confirmed, selected group role may be used for
 * DynSiteAPI forRole. ADMIN and EDITOR are permissions.
 * Without an available group role, return null.
 */
export function selectBackendMenuPreviewRole(
  state: TemplateRootState,
): string | null {
  return selectGroupMenuRole(state);
}
