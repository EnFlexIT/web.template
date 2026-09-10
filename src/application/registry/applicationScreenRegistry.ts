import type {
  RegisteredScreen,
  ScreenRegistry,
} from "@template";

import {
  templateScreenRegistry,
} from "@template";

import {
  ProgramStartTab,
} from "@/application/screens/agent-workbench/ProgramStartTab";

import {
  DataAnalyzingTab,
} from "@/application/screens/agent-workbench/DataAnalyzingTab";

import {
  GeneralSettingsTab,
} from "@/application/screens/agent-workbench/database/GeneralSettingsTab";

import {
  FactorySettingsTab,
} from "@/application/screens/agent-workbench/database/FactorySettingsTab";

import {
  DerbyNetworkServerTab,
} from "@/application/screens/agent-workbench/database/DerbyNetworkServerTab";

/**
 * Application-specific screen registry.
 *
 * The Application extends the reusable Template registry
 * with its own product-specific screens.
 */
export const applicationScreenRegistry:
  ScreenRegistry = {
  ...templateScreenRegistry,

  "program-start":
    ProgramStartTab,

  "data-analyzing":
    DataAnalyzingTab,

  "general-settings":
    GeneralSettingsTab,

  "factory-settings":
    FactorySettingsTab,

  "derby-network-server":
    DerbyNetworkServerTab,
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