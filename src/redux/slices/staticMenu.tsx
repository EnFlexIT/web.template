import { ComponentClass, FunctionComponent } from "react";

// Screens
import { SettingsScreen } from "../../screens/Settings";
import { UnauthenticatedSettings } from "../../screens/settings/Unauthenticated-Settings";
import { PrivacySettings } from "../../screens/settings/PrivacySettings";
import { DevHomeScreen } from "../../screens/dev/Dev-Home-Screen";
import { ServerSettingsScreen } from "../../screens/ServerSettings";
import { ChangePasswordScreen } from "../../screens/settings/ChangePassword";
import { UpdateWebAppTab } from "../../screens/update/tabs/UpdateWebAppTab";
import { NotificationsScreen } from "../../screens/Notification/NotificationsScreen";
// Hub
import { MenuHubScreen } from "../../screens/MenuHubScreen";

// Logic
import { isMenuEnabled } from "./featureFlags";


import { withAutoTabs } from "../../components/config/tabAuto";
import { ProgramStartTab } from "../../screens/AgentWorkbenchOptions/ProgramStartTab";
import { DataAnalyzingTab } from "../../screens/AgentWorkbenchOptions/DataAnalyzingTab";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};

export function getStaticMenu(): StaticMenuItem[] {
  /**
   * ============================================================
   * ROOT LEVEL (Hauptbereiche der App)
   * ============================================================
   * Diese Einträge sind oberste Navigationsebenen.
   * Sie sind KEINE Tabs.
   */
  const items: StaticMenuItem[] = [
    { 
      caption: "settings", 
      menuID: 3003, 
      Screen: SettingsScreen 
    },
    /**
     * ============================================================
     * UNTERPUNKTE DIREKT UNTER SETTINGS (notifications)
     * ============================================================
     */

    {
      caption: "notifications",
      menuID: 3015,
      parentID: 3003,
      Screen: NotificationsScreen,
    },
    /**
     * ============================================================
     * HUB SCREEN (Ordner-Ebene)
     * ============================================================
     * MenuHubScreen zeigt alle Kinder (parentID === menuID).
     * Das ist vergleichbar mit einem Ordner.
     * Diese Einträge werden NIE zu Tabs umgewandelt.
     */
    { 
      caption: "System Settings", 
      menuID: 3021, 
      parentID: 3003, 
      Screen: MenuHubScreen 
    },
      { 
      caption: "personalSettings", 
      menuID: 3022, 
      parentID: 3003, 
      Screen: MenuHubScreen 
    },
  
    /**
     * ============================================================
     * UNTERPUNKTE DIREKT UNTER SETTINGS (Normale Screens)
     * ============================================================
     * Diese Einträge sind klassische Screens.
     * Falls für deren menuID Tabs existieren,
     * wird Screen automatisch durch TabScreen ersetzt.
     */
    { 
      caption: "Appearance", 
      menuID: 3004, 
      parentID: 3022, 
      Screen: UnauthenticatedSettings 
    },

    { 
      caption: "privacysettings", 
      menuID: 3005, 
      parentID: 3022, 
      Screen: PrivacySettings 
    },

    { 
      caption: "changePassword", 
      menuID: 3013, 
      parentID: 3022, 
      Screen: ChangePasswordScreen 
    },


    /**
     * ============================================================
     * UNTERPUNKTE VON "System Settings"
     * ============================================================
     * Diese befinden sich im Hub (parentID: 3021).
     * 
     * Wichtig:
     * Wenn für eine menuID Tabs in staticTabs.tsx existieren,
     * wird Screen automatisch zu TabScreen.
     */

    { 
      caption: "serverSettings", 
      menuID: 3012, 
      parentID: 3021, 
      Screen: ServerSettingsScreen 
    },
   { 
      caption: "appInfo", 
      menuID: 3014, 
      parentID: 3021, 
      Screen: UpdateWebAppTab 
    },
      {
      caption: "options",
      menuID: 3023,
      parentID: 3021,
      Screen: ProgramStartTab,
    },
  
    { 
      caption: "databaseConnectionsAndSettings", 
      menuID: 3010, 
      parentID: 3021, 
      Screen: ServerSettingsScreen 
    },

    /**
     * ============================================================
     * TAB-BEREICH (Automatisch TabScreen)
     * ============================================================
     * Dieser Menüpunkt bekommt Tabs,
     * sobald in staticTabs.tsx Einträge mit menuID: 3010 existieren.
     *
     * Wir setzen hier absichtlich einen normalen Screen als Fallback.
     * withAutoTabs() ersetzt ihn automatisch durch TabScreen,
     * wenn Tabs vorhanden sind.
     */
   

    /**
     * ============================================================
     * WEITERE BEREICHE
     * ============================================================
     */

    { 
      caption: "devHome", 
      menuID: 3011, 
      parentID: 3003, 
      Screen: DevHomeScreen 
    },

 
 
  ];

  /**
   * ============================================================
   * FEATURE FLAG FILTER
   * ============================================================
   * Entfernt deaktivierte Menüeinträge.
   */
  const enabled = items.filter((it) => isMenuEnabled(it.menuID));

  /**
   * ============================================================
   * AUTO TAB CONVERSION
   * ============================================================
   * Wenn für eine menuID Tabs existieren (staticTabs.tsx),
   * wird der Screen automatisch zu TabScreen umgewandelt.
   *
   * → Keine manuelle Pflege notwendig.
   */
  return withAutoTabs(enabled);
}