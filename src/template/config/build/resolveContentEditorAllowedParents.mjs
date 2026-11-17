/**
 * Resolves Application-owned content placement configuration.
 *
 * This is a build-time placement policy, not authorization.
 * Only active and generated Application menus are accepted.
 */
export function resolveContentEditorAllowedParents({
  rawValue,
  enabledApplicationMenus,
  selectedMenuKeys,
  menuItems,
  getMenuId,
}) {
  const allowedParentIds = [];

  if (!rawValue) {
    return allowedParentIds;
  }

  const allowedKeys = rawValue
    .split(",")
    .map((key) => key.trim());

  if (
    allowedKeys.some((key) => !key) ||
    new Set(allowedKeys).size !== allowedKeys.length
  ) {
    throw new Error(
      "Invalid contentEditor.allowedParents: empty or duplicate menu key.",
    );
  }

  for (const menuKey of allowedKeys) {
    const applicationMenu = enabledApplicationMenus.find(
      (item) => item.key === menuKey,
    );

    if (
      !applicationMenu ||
      !selectedMenuKeys.has(menuKey)
    ) {
      throw new Error(
        `Invalid contentEditor.allowedParents: "${menuKey}" is not an active Application menu.`,
      );
    }

    const menuID = getMenuId(menuKey);

    if (
      !menuItems.some((item) => item.menuID === menuID)
    ) {
      throw new Error(
        `Invalid contentEditor.allowedParents: "${menuKey}" is not generated.`,
      );
    }

    allowedParentIds.push(`static:${menuID}`);
  }

  return allowedParentIds;
}