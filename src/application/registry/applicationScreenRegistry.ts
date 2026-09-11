import type {
  RegisteredScreen,
  ScreenRegistry,
} from "@template";

import {
  templateScreenRegistry,
} from "@template";

/**
 * Application-specific screen registry.
 *
 * The Application extends the reusable Template registry
 * with optional application-specific screens.
 */
export const applicationScreenRegistry:
  ScreenRegistry = {
  ...templateScreenRegistry,
};

export function resolveApplicationScreen(
  key: string,
): RegisteredScreen {
  const screen =
    applicationScreenRegistry[
      key
    ];

  if (!screen) {
    throw new Error(
      `Unknown application screen registry key: "${key}".`,
    );
  }

  return screen;
}