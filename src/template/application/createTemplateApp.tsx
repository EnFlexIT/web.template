import React from "react";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import TemplateApp from "@/template/application/TemplateApp";

import {
  configureNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

/**
 * Connects a concrete application configuration with the
 * reusable template shell.
 */
export function createTemplateApp<
  TState = unknown,
>(
  config: ApplicationConfig<TState>,
): React.ComponentType {
  configureNavigationRuntime<TState>(
    config.navigation,
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