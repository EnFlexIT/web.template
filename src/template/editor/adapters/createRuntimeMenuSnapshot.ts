import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  createStaticMenuSnapshot,
} from "./createStaticMenuSnapshot";

import type {
  StaticMenuSnapshot,
} from "./createStaticMenuSnapshot";

/**
 * Reads the complete registered static navigation.
 *
 * This must not use Redux rawMenu because rawMenu
 * may already be filtered or merged with dynamic menus.
 *
 * The returned snapshot remains separate from
 * the production navigation.
 */
export function createRuntimeMenuSnapshot(
  applicationId: string,
): StaticMenuSnapshot {
  const navigation = getNavigationRuntime();

  return createStaticMenuSnapshot(
    applicationId,
    navigation.menu.items,
  );
}
