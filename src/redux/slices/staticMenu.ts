import { ComponentClass, FunctionComponent } from "react";

import { SettingsScreen } from "../../screens/Settings";
import { UnauthenticatedSettings } from "../../screens/settings/Unauthenticated-Settings";
import { PrivacySettings } from "../../screens/settings/PrivacySettings";
import { DatabaseConnectionsSettings } from "../../screens/settings/DatabaseConnectionsSettings";
import { DevHomeScreen } from "../../screens/dev/Dev-Home-Screen";
import { ServerSettingsScreen } from "../../screens/ServerSettings";
import { ChangePasswordScreen } from "../../screens/settings/ChangePassword";
import { isMenuEnabled } from "./featureFlags";
import { MenuHubScreen } from "../../screens/MenuHubScreen";
export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
 
};

/**
 *  Statische Menüpunkte, die immer existieren (BaseMode + normal)
 * KEIN Redux Import hier -> vermeidet Require Cycle
 */
export function getStaticMenu(): StaticMenuItem[] {
  const items: StaticMenuItem[] = [
    { caption: "settings", menuID: 3003, Screen: SettingsScreen },

    { caption: "general", menuID: 3004, parentID: 3003, Screen: UnauthenticatedSettings },

     //  Ordner -> Hub Screen (ein Screen für alle)
    { caption: "Personal Settings", menuID: 3020, parentID: 3003, Screen: MenuHubScreen },
    { caption: "System Settings", menuID: 3021, parentID: 3003, Screen: MenuHubScreen },

    // Kinder unter "personalized"
    { caption: "privacysettings", menuID: 3005, parentID: 3020, Screen: PrivacySettings },
    { caption: "changePassword", menuID: 3013, parentID: 3020, Screen: ChangePasswordScreen },

    // Kinder unter "systemsettings"
    { caption: "serverSettings", menuID: 3012, parentID: 3021, Screen: ServerSettingsScreen },
    { caption: "databaseConnectionsAndSettings", menuID: 3010, parentID: 3021, Screen: DatabaseConnectionsSettings },

     // Dev-Bereich
    { caption: "devHome", menuID: 3011, parentID: 3003, Screen: DevHomeScreen },
    
  ];

  return items.filter((it) => isMenuEnabled(it.menuID));
}
