import { ComponentClass, FunctionComponent } from "react";
import { hasTabsForMenu } from "../../redux/slices/staticTabs";
import { MenuHubScreen } from "../../screens/MenuHubScreen";
import { TabScreen } from "../../screens/TabScreen";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};

export function withAutoTabs(items: StaticMenuItem[]): StaticMenuItem[] {
  return items.map((it) => {
    // Hubs nie in Tabs umwandeln
    if (it.Screen === MenuHubScreen) return it;

    // Wenn es Tabs gibt -> TabScreen
    if (hasTabsForMenu(it.menuID)) {
      return { ...it, Screen: TabScreen };
    }

    return it;
  });
}