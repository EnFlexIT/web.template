import { ComponentClass, FunctionComponent } from "react";

import { SettingsScreen } from "../../screens/Settings";
import { UnauthenticatedSettings } from "../../screens/settings/Unauthenticated-Settings";
import { PrivacySettings } from "../../screens/settings/PrivacySettings";
import { DatabaseConnectionsSettings } from "../../screens/settings/DatabaseConnectionsSettings";
import { DevHomeScreen } from "../../screens/dev/Dev-Home-Screen";
import { ServerSettingsScreen } from "../../screens/ServerSettings";

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
  return [
    { caption: "settings", menuID: 3003, Screen: SettingsScreen },
    { caption: "general", menuID: 3004, parentID: 3003, Screen: UnauthenticatedSettings },
    { caption: "privacysettings", menuID: 3005, parentID: 3003, Screen: PrivacySettings },
    { caption: "databaseConnectionsAndSettings", menuID: 3010, parentID: 3003, Screen: DatabaseConnectionsSettings },
    { caption: "devHome", menuID: 3011, parentID: 3003, Screen: DevHomeScreen },
    { caption: "serverSettings", menuID: 3012, parentID: 3003, Screen: ServerSettingsScreen },
  ];
}
