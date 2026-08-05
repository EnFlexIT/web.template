import React from "react";

import type {StaticMenuItem,} from "@/template/navigation/menu/types";

import { hasTabsForMenu } from "@/template/navigation/tabs/staticTabs";
import { MenuHubScreen } from "@/template/screens/menu/MenuHubScreen";
import { TabScreen } from "@/template/screens/tabscreen/TabScreen";


export function withAutoTabs(items: StaticMenuItem[]): StaticMenuItem[] {
  return items.map((item) => {
    // Hub-Screens niemals automatisch in Tab-Screens umwandeln.
    if (item.Screen === MenuHubScreen) {
      return item;
    }

    // Wenn für das Menü Tabs existieren, wird automatisch TabScreen verwendet.
    if (hasTabsForMenu(item.menuID)) {
      return {
        ...item,
        Screen: () => <TabScreen menuID={item.menuID} />,
      };
    }

    return item;
  });
}
