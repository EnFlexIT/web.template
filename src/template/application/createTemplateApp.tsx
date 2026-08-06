import React from "react";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import TemplateApp from "@/template/application/TemplateApp";

/**
 * Verbindet eine konkrete Application-Konfiguration mit der
 * wiederverwendbaren Template-Shell.
 */
export function createTemplateApp(
  config: ApplicationConfig,
): React.ComponentType {
  function ConfiguredTemplateApp() {
    return (
      <TemplateApp config={config} />
    );
  }

  ConfiguredTemplateApp.displayName =
    `${config.displayName}App`;

  return ConfiguredTemplateApp;
}