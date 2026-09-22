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

/**
 * Stable version and release information of the
 * concrete Application and the reusable Base Template.
 *
 * Release-specific values are injected by the
 * release/build pipeline and therefore remain optional.
 */
export type ApplicationBuildInfo = {
  application: {
    packageName?: string;
    version?: string;
    releaseTag?: string;
  };

  template: {
    packageName: string;
    version: string;
  };

  build?: {
    timestamp: string;
  };
};

export type ApplicationConfig<
  TState = unknown,
> = {
  /**
   * Stable technical application identifier.
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

  /**
   * Generated Application, Template and release
   * metadata.
   */
  buildInfo?: ApplicationBuildInfo;

  navigation: {
    menu: {
      /**
       * Controls whether menu icons are shown.
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