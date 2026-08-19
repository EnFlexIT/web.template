import React from "react";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import type {
  TemplateStore,
} from "@/template/state/store/types";

import TemplateApp from "@/template/application/TemplateApp";

import {
  configureNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  withAutoTabs,
} from "@/template/navigation/tabs/withAutoTabs";

export type CreateTemplateAppOptions = {
  store: TemplateStore;
};

/**
 * Connects a concrete application with the reusable Template shell.
 *
 * The concrete Application owns the store composition.
 * The Template only consumes the resulting store.
 */
export function createTemplateApp<
  TState = unknown,
>(
  config: ApplicationConfig<TState>,
  options: CreateTemplateAppOptions,
): React.ComponentType {
  const navigation = {
    menu: {
      ...config.navigation.menu,

      items: withAutoTabs(
        [
          ...config.navigation.menu.items,
        ],
        (menuID) =>
          config.navigation.tabs.items.some(
            (tab) =>
              tab.menuID === menuID,
          ),
      ),
    },

    tabs:
      config.navigation.tabs,
  };

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
        store={options.store}
      />
    );
  }

  ConfiguredTemplateApp.displayName =
    `${config.displayName}App`;

  return ConfiguredTemplateApp;
}