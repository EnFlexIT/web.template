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
import type { AuthMethod } from "../../redux/slices/apiSlice";
import {UserProfileScreen} from "../../screens/UserProfile/UserProfileScreen";
// Hub
import { MenuHubScreen } from "../../screens/MenuHubScreen";
import { AppSettingsFileUploadScreen } from "../../screens/settings/AppSettingsFileUploadScreen";
// Logic
import { isMenuEnabled } from "./featureFlags";
import { withAutoTabs } from "../../components/config/tabAuto";
import { ProgramStartTab } from "../../screens/AgentWorkbenchOptions/ProgramStartTab";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};

export function getStaticMenu(authenticationMethod?: AuthMethod,): StaticMenuItem[] 
{
  
  const items: StaticMenuItem[] = [
    {
      caption: "settings",
      menuID: 3003,
      Screen: SettingsScreen,
    },
    {
      caption: "notifications",
      menuID: 3015,
      parentID: 3003,
      Screen: NotificationsScreen,
    },
    {
      caption: "SystemSettings",
      menuID: 3021,
      parentID: 3003,
      Screen: MenuHubScreen,
    },
    {
      caption: "personalSettings",
      menuID: 3022,
      parentID: 3003,
      Screen: MenuHubScreen,
    },
    {
      caption: "Appearance",
      menuID: 3004,
      parentID: 3022,
      Screen: UnauthenticatedSettings,
    },
    {
      caption: "privacysettings",
      menuID: 3005,
      parentID: 3022,
      Screen: PrivacySettings,
    },
   {
      caption: "UserProfile",
      menuID: 3006,
      parentID: 3022,
      Screen: UserProfileScreen,
    },
    {
      caption: "changePassword",
      menuID: 3013,
      parentID: 3022,
      Screen: ChangePasswordScreen,
    },
    {
      caption: "serverSettings",
      menuID: 3012,
      parentID: 3021,
      Screen: ServerSettingsScreen,
    },
    {
      caption: "appInfo",
      menuID: 3014,
      parentID: 3021,
      Screen: UpdateWebAppTab,
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
      Screen: ServerSettingsScreen,
    },
    {
      caption: "devHome",
      menuID: 3011,
      parentID: 3003,
      Screen: DevHomeScreen,
    },
    {
      caption: "settingsFileUpload",
      menuID: 3024,
      parentID: 3021,
      Screen: AppSettingsFileUploadScreen,
    },
  ];

const enabled = items.filter((it) => isMenuEnabled(it.menuID, authenticationMethod));
  return withAutoTabs(enabled);
}