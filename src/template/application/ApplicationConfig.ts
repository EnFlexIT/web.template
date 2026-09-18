import type {
  ImageSourcePropType,
} from "react-native";

import type {
  AuthMethod,
} from "@/template/state/api/apiSlice";

import type {
  StaticMenuItem,
} from "@template";

import type {
  StaticTabItem,
} from "@template";

export type MenuVisibilityContext = {
  authenticationMethod?: AuthMethod;
};

export type TabVisibilityContext<
  TState = unknown,
> = {
  state?: TState;
};

export type MenuVisibilityResolver = (
  menuID: number,
  context: MenuVisibilityContext,
) => boolean;

export type TabVisibilityResolver<
  TState = unknown,
> = (
  featureID: number,
  context: TabVisibilityContext<TState>,
) => boolean;

export type ApplicationBranding = {
  /**
   * Optional Application logo.
   *
   * When omitted, the Base Template may use
   * its default branding.
   */
  logo?: ImageSourcePropType;
};

export type ApplicationConfig<
  TState = unknown,
> = {
  /**
   * Stable technical application identifier.
   *
   * Examples:
   * - base-template
   * - agent-workbench
   * - plant-assist
   */
  id: string;

  /**
   * Visible application name.
   */
  displayName: string;

  /**
   * Optional Application-specific branding.
   */
  branding?: ApplicationBranding;

  navigation: {
    menu: {
      /**
       * Controls whether menu icons are shown.
       *
       * When omitted or false, the navigation
       * keeps the classic text-only appearance.
       */
      showIcons?: boolean;

      items: readonly StaticMenuItem[];

      isEnabled:
        MenuVisibilityResolver;
    };

    tabs: {
      items: readonly StaticTabItem[];

      isEnabled:
        TabVisibilityResolver<TState>;
    };
  };
};