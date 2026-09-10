import React from "react";

import type {
  StaticMenuItem,
} from "@template";

import {
  MenuHubScreen,
} from "@/template/screens/menu/MenuHubScreen";

import {
  TabScreen,
} from "@/template/screens/tabscreen/TabScreen";

export type HasTabsForMenu = (
  menuID: number,
) => boolean;

/**
 * Replaces menu screens with the generic TabScreen when
 * tabs are configured for the corresponding menu.
 *
 * The concrete tab source is supplied by the caller.
 */
export function withAutoTabs(
  items: StaticMenuItem[],
  hasTabsForMenu: HasTabsForMenu,
): StaticMenuItem[] {
  return items.map((item) => {
    // Hub screens must never be converted into tab screens.
    if (item.Screen === MenuHubScreen) {
      return item;
    }

    if (hasTabsForMenu(item.menuID)) {
      return {
        ...item,
        Screen: () => (
          <TabScreen
            menuID={item.menuID}
          />
        ),
      };
    }

    return item;
  });
}