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

import {
  withAutoTabs,
} from "@/template/navigation/tabs/withAutoTabs";

/**
 * Connects a concrete application configuration with the
 * reusable Template shell.
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
      ? {
          menu: {
            ...config.navigation.menu,

            items: withAutoTabs(
              [
                ...config.navigation.menu.items,
              ],
              (menuID) =>
                config.navigation.tabs.items.some(
                  (tab) =>
                    tab.menuID ===
                    menuID,
                ),
            ),
          },

          tabs: config.navigation.tabs,
        }
      : createLegacyNavigationConfig<TState>();

  configureNavigationRuntime<TState>(
    navigation,
  );

  const resolvedConfig:
    ApplicationConfig<TState> = {
    ...config,
    navigation,
  };

  function ConfiguredTemplateApp() {
    return (
      <TemplateApp
        config={resolvedConfig}
      />
    );
  }

  ConfiguredTemplateApp.displayName =
    `${config.displayName}App`;

  return ConfiguredTemplateApp;
}