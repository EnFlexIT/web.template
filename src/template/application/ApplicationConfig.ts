import type {
  ImageSourcePropType,
} from "react-native";

import type {
  AuthMethod,
} from "@/template/state/api/apiSlice";

import type {
  EffectiveUserRole,
} from "@/template/authorization/roles";

import type {
  StaticMenuItem,
} from "@template";

import type {
  StaticTabItem,
} from "@template";


export type MenuVisibilityContext = {
  /**
   * Authentication mechanism of the current session.
   */
  authenticationMethod?: AuthMethod;

  /**
   * Effective authorization roles of the current user.
   *
   * superAdmin itself is intentionally not an effective role.
   * It is resolved to:
   *
   * user
   * frontendEditor
   * backendEditor
   */
  effectiveRoles?:
    readonly EffectiveUserRole[];
};


export type TabVisibilityContext<
  TState = unknown,
> = {
  /**
   * Application / Template Redux state.
   */
  state?: TState;

  /**
   * Prepared for role-based tab visibility.
   *
   * Tab authorization will be connected separately because
   * the current tab runtime only evaluates tabs that have a
   * runtime feature ID.
   */
  effectiveRoles?:
    readonly EffectiveUserRole[];
};


export type MenuVisibilityResolver = (
  menuID: number,
  context: MenuVisibilityContext,
) => boolean;


export type TabVisibilityResolver<
  TState = unknown,
> = (
  featureID: number,
  context:
    TabVisibilityContext<TState>,
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
    timestamp?: string;

    commitSha?: string;
  };

  release?: {
    /**
     * Application-specific release notes.
     *
     * Generated build metadata is immutable, therefore
     * the release-note arrays are readonly.
     */
    notes?: readonly string[];

    /**
     * Release notes belonging to the reusable Base Template.
     *
     * These notes are shipped together with the Template version.
     */
    templateNotes?:
      readonly string[];
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
  buildInfo?:
    ApplicationBuildInfo;


  navigation: {
    menu: {
      /**
       * Controls whether menu icons are shown.
       */
      showIcons?: boolean;


      /**
       * Internal menu ID resolved from the semantic
       * NavigationDefaultMenu configuration.
       */
      defaultMenuID?: number;


      items:
        readonly StaticMenuItem[];


      isEnabled:
        MenuVisibilityResolver;
    };


    tabs: {
      items:
        readonly StaticTabItem[];


      isEnabled:
        TabVisibilityResolver<TState>;
    };
  };
};