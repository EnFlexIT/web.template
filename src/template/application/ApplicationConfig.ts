import type {
  AuthMethod,
} from "@/template/state/api/apiSlice";

import type {
  StaticMenuItem,
} from "@/template/navigation/menu/types";

import type {
  StaticTabItem,
} from "@/template/navigation/tabs/types";

export type MenuVisibilityContext = {authenticationMethod?: AuthMethod;};

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

export type ApplicationConfig<
  TState = unknown,
> = {
  /**
   * Stable technical application identifier.
   *
   * Examples:
   * - base-template
   * - agent-workbench
   * - hems
   */
  id: string;

  /**
   * Visible application name.
   */
  displayName: string;

  navigation: {
    menu: {
      items: readonly StaticMenuItem[];
      isEnabled: MenuVisibilityResolver;
    };

    tabs: {
      items: readonly StaticTabItem[];
      isEnabled: TabVisibilityResolver<TState>;
    };
  };
};