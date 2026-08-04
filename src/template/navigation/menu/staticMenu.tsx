import { ComponentClass, FunctionComponent } from "react";


// Screens
import { SettingsScreen } from "@/template/screens/settings/Settings";
import { UnauthenticatedSettings } from "@/template/screens/settings/Unauthenticated-Settings";
import { PrivacySettings } from "@/template/screens/settings/PrivacySettings";
import { DevHomeScreen } from "@/template/screens/dev/Dev-Home-Screen";
import { ServerSettingsScreen } from "@/template/screens/server/ServerSettings";
import { ChangePasswordScreen } from "@/template/screens/settings/ChangePassword";
import { UpdateWebAppTab } from "@/template/screens/update/tabs/UpdateWebAppTab";
import { NotificationsScreen } from "@/template/screens/Notification/NotificationsScreen";
import { UserProfileScreen } from "@/template/screens/UserProfile/UserProfileScreen";

// Hub
import { MenuHubScreen } from "@/template/screens/menu/MenuHubScreen";
import { AppSettingsFileUploadScreen } from "@/template/screens/settings/AppSettingsFileUploadScreen";

// Agent Workbench Options
import { ProgramStartTab } from "@/template/screens/AgentWorkbenchOptions/ProgramStartTab";
import { LiveConsoleScreen } from "@/template/screens/liveConsole/LiveConsoleScreen";

// Types and logic
import type { AuthMethod } from "@/template/state/api/apiSlice";
import { withAutoTabs } from "@/template/navigation/tabs/withAutoTabs";
import { isMenuEnabled } from "./featureFlags";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};

export function getStaticMenu(
  authenticationMethod?: AuthMethod,
): StaticMenuItem[] {
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
      menuID: 3025,
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

    // Agent Workbench Options
    {
      caption: "options",
      menuID: 3023,
      parentID: 3021,
      position: 1,
      Screen: ProgramStartTab,
    },
    {
      caption: "liveConsole",
      menuID: 3026,
      parentID: 3021,
      Screen: LiveConsoleScreen,
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

  const enabled = items.filter((item) =>
    isMenuEnabled(item.menuID, authenticationMethod),
  );

  return withAutoTabs(enabled);
}