import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import {
  applicationConfig as generatedApplicationConfig,
} from "@/application/generated/applicationConfig.generated";

import {
  applicationMenuItems,
} from "@/application/config/menu.config";

import {
  isApplicationMenuEnabled,
} from "@/application/config/menuFeatureFlags.config";

import {
  applicationTabItems,
} from "@/application/config/tabs.config";

import {
  isApplicationTabEnabled,
  type ApplicationNavigationState,
} from "@/application/config/tabFeatureFlags.config";

export const applicationConfig:
  ApplicationConfig<ApplicationNavigationState> = {
  ...generatedApplicationConfig,

  navigation: {
    menu: {
      items: applicationMenuItems,
      isEnabled:
        isApplicationMenuEnabled,
    },

    tabs: {
      items: applicationTabItems,
      isEnabled:
        isApplicationTabEnabled,
    },
  },
};