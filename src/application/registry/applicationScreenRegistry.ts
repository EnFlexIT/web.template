import type {
  RegisteredScreen,
  ScreenRegistry,
} from "@/template/navigation/registry/types";

import {
  templateScreenRegistry,
} from "@/template/navigation/registry/templateScreenRegistry";

import {
  ProgramStartTab,
} from "@/template/screens/AgentWorkbenchOptions/ProgramStartTab";

import {
  DataAnalyzingTab,
} from "@/template/screens/AgentWorkbenchOptions/DataAnalyzingTab";

/**
 * Application-specific screen registry.
 *
 * Agent.Workbench screens are still physically located
 * in the Template repository during the migration.
 *
 * They will later move into the Application layer without
 * changing the properties-based navigation protocol.
 */
export const applicationScreenRegistry:
  ScreenRegistry = {
  ...templateScreenRegistry,

  "program-start":
    ProgramStartTab,

  "data-analyzing":
    DataAnalyzingTab,
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