import React from "react";
import { ComponentType } from "react";



import { isTabEnabled } from "./tabFeatureFlags";

// Tabs (deine Imports)
import { DerbyNetworkServerTab } from "../../screens/settings/database/DerbyNetworkServerTab";
import { FactorySettingsTab } from "../../screens/settings/database/FactorySettingsTab";
import { GeneralSettingsTab } from "../../screens/settings/database/GeneralSettingsTab";
import { UpdateGeneralTab } from "../../screens/update/tabs/UpdateGeneralTab";
import { UpdateWebAppTab } from "../../screens/update/tabs/UpdateWebAppTab";
import { UpdateBackendTab } from "../../screens/update/tabs/UpdateBackendTab";
export type TabContent = ComponentType<any> | (() => React.ReactNode);

export type StaticTabItem = {
  menuID: number;
  tabKey: string;
  caption: string;
  position?: number;
  featureID?: number;
  Content: TabContent;
};

export const STATIC_TABS: StaticTabItem[] = [

  {
    menuID: 3010,
    tabKey: "general",
    caption: "General",
    position: 1,
    Content: GeneralSettingsTab,
  },

  {
    menuID: 3010,
    tabKey: "factory",
    caption: "Factory Settings",
    position: 2,
     featureID: 5001,// diese Tab hat eine Feature Flag (5001) - siehe tabFeatureFlags.ts
    Content: FactorySettingsTab,
  },

  {
    menuID: 3010,
    tabKey: "derby",
    caption: "Derby Network Server",
    position: 3,
    Content: DerbyNetworkServerTab,
  },
  /**
   * ============================================================
   * Update Menü (menuID 3014 = appInfo)
   * ============================================================
   */
  {
    menuID: 3014,
    tabKey: "general",
    caption: "General",
    position: 1,
    Content: UpdateGeneralTab,
  },
  {
    menuID: 3014,
    tabKey: "webapp",
    caption: "Web-App",
    position: 2,
    Content: UpdateWebAppTab,
  },
  {
    menuID: 3014,
    tabKey: "backend",
    caption: "Backend",
    position: 3,
      featureID: 3111, // diese Tab hat eine Feature Flag (3014) - siehe tabFeatureFlags.ts
    Content: UpdateBackendTab,
  },

  
  // { menuID: 3010, tabKey: "newTab", caption: "New Tab", position: 4, featureID: 5002, Content: NewTabComponent },
];

export function getTabsForMenu(menuID: number): StaticTabItem[] {
  return STATIC_TABS
    .filter((t) => t.menuID === menuID)
    .filter((t) => (t.featureID ? isTabEnabled(t.featureID) : true))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function hasTabsForMenu(menuID: number): boolean {
  return getTabsForMenu(menuID).length > 0;
}