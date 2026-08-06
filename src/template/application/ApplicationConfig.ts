import type { AuthMethod } from "@/template/state/api/apiSlice";
import type { RootState } from "@/template/state/store/store";

import type {StaticMenuItem,} from "@/template/navigation/menu/types";

import type {StaticTabItem,} from "@/template/navigation/tabs/types";

export type MenuVisibilityContext = {
  authenticationMethod?: AuthMethod;
};

export type TabVisibilityContext = {
  state?: RootState;
};

export type MenuVisibilityResolver = (
  menuID: number,
  context: MenuVisibilityContext,
) => boolean;

export type TabVisibilityResolver = (
  featureID: number,
  context: TabVisibilityContext,
) => boolean;

export type ApplicationConfig = {
  /**
   * Technische, stabile ID.
   *
   * Beispiele:
   * - base-template
   * - hems
   * - agent-workbench
   */
  id: string;

  /**
   * Sichtbarer Name der Anwendung.
   */
  displayName: string;

  navigation: {
    menu: {
      items: readonly StaticMenuItem[];
      isEnabled: MenuVisibilityResolver;
    };

    tabs: {
      items: readonly StaticTabItem[];
      isEnabled: TabVisibilityResolver;
    };
  };
};
