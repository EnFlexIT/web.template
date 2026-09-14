import type {
  RegisteredScreen,
  ScreenRegistry,
} from "@template";

import {
  templateScreenRegistry,
} from "@template";

import {
  generatedApplicationScreenRegistry,
} from "../generated/applicationScreenRegistry.generated";

/**
 * Complete screen registry of the concrete Application.
 *
 * Template screens are inherited from the Base Template.
 * Application-owned screens are discovered and registered
 * automatically by the configuration generator.
 */
export const applicationScreenRegistry:
  ScreenRegistry = {
  ...templateScreenRegistry,
  ...generatedApplicationScreenRegistry,
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
      `Unknown screen registry key: "${key}".`,
    );
  }

  return screen;
}