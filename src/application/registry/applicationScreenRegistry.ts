import type {
  RegisteredScreen,
  ScreenRegistry,
} from "@template";

import {
  templateScreenRegistry,
} from "@template";

import {
  ExampleScreen,
} from "@/application/screens/ExampleScreen";

/**
 * Application-specific screen registry.
 *
 * The Application inherits all screens provided by the
 * Base Template and may register additional screens here.
 */
export const applicationScreenRegistry:
  ScreenRegistry = {
  ...templateScreenRegistry,

  "example-screen":
    ExampleScreen,
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