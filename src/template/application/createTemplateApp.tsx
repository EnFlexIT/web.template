import React from "react";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import TemplateApp from "@/template/application/TemplateApp";

import {
  configureNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  createLegacyNavigationConfig,
} from "@/template/navigation/legacyNavigationConfig";

/**
 * Connects a concrete application configuration with the
 * reusable template shell.
 */
export function createTemplateApp<
  TState = unknown,
>(
  config: ApplicationConfig<TState>,
): React.ComponentType {
  const hasConfiguredNavigation =
    config.navigation.menu.items.length > 0 ||
    config.navigation.tabs.items.length > 0;

  const navigation =
    hasConfiguredNavigation
      ? config.navigation
      : createLegacyNavigationConfig<TState>();

  configureNavigationRuntime<TState>(
    navigation,
  );

  function ConfiguredTemplateApp() {
    return (
      <TemplateApp
        config={config}
      />
    );
  }

  ConfiguredTemplateApp.displayName =
    `${config.displayName}App`;

  return ConfiguredTemplateApp;
}