import React, {
  type ComponentClass,
  type FunctionComponent,
} from "react";

import { hasTabsForMenu } from "@/template/navigation/tabs/staticTabs";
import { MenuHubScreen } from "@/template/screens/menu/MenuHubScreen";
import { TabScreen } from "@/template/screens/tabscreen/TabScreen";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};

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