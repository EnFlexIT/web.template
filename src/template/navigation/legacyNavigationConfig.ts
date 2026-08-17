import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import {
  getStaticMenu,
} from "@/template/navigation/menu/staticMenu";

import {
  isMenuEnabled,
} from "@/template/navigation/menu/featureFlags";

import {
  STATIC_TABS,
} from "@/template/navigation/tabs/staticTabs";

import {
  isTabEnabled,
} from "@/template/navigation/tabs/tabFeatureFlags";

import type {
  RootState,
} from "@/template/state/store/store";

/**
 * Temporary compatibility adapter for the existing
 * static Template navigation.
 *
 * This adapter will be removed once navigation is generated
 * from the Application properties configuration.
 */
export function createLegacyNavigationConfig<
  TState = RootState,
>(): ApplicationConfig<TState>["navigation"] {
  return {
    menu: {
      items: getStaticMenu(),

      isEnabled: (
        menuID,
        context,
      ) =>
        isMenuEnabled(
          menuID,
          context.authenticationMethod,
        ),
    },

    tabs: {
      items: STATIC_TABS,

      isEnabled: (
        featureID,
        context,
      ) =>
        isTabEnabled(
          featureID,
          context.state as RootState | undefined,
        ),
    },
  };
}