import type {
  MenuItem,
  MenuList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  BackendMenuRenameContext,
} from "./renameBackendMenuV2";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

import {
  validateBackendMenuSiblingPositionsV2,
} from "./backendMenuPositionValidatorV2";

export interface BackendMenuStructureClientV2 {
  getAllMenus(
    lang?: string,
  ): Promise<{ data: MenuList }>;

  updateMenu(
    menuId: number,
    menuItem: MenuItem,
  ): Promise<unknown>;
}

export interface BackendMenuStructureContextV2
  extends Omit<BackendMenuRenameContext, "client"> {
  client: BackendMenuStructureClientV2;
}

/**
 * Compares all affected sibling groups against the
 * locally planned inventory after a structural write.
 */
export function verifyBackendMenuStructureV2(
  expected: readonly MenuItem[],
  actual: readonly MenuItem[],
  affectedParents: readonly (number | null)[],
): void {
  buildBackendMenuTreeV2(actual);

  for (const parentId of new Set(affectedParents)) {
    validateBackendMenuSiblingPositionsV2(
      actual,
      parentId,
    );

    const planned = expected
      .filter(item => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.position - b.position);

    const saved = actual
      .filter(item => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.position - b.position);

    if (
      saved.length !== planned.length ||
      saved.some((item, index) =>
        item.menuId !== planned[index].menuId ||
        item.position !== planned[index].position ||
        item.isHeadMenu !== planned[index].isHeadMenu,
      )
    ) {
      throw new Error(
        "Saved sibling structure differs from the planned inventory.",
      );
    }
  }
}
