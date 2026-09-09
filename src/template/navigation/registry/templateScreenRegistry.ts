import type {
  ScreenRegistry,
} from "@/template/navigation/registry/types";

import {
  SettingsScreen,
} from "@/template/screens/settings/Settings";

import {
  UnauthenticatedSettings,
} from "@/template/screens/settings/Unauthenticated-Settings";

import {
  PrivacySettings,
} from "@/template/screens/settings/PrivacySettings";

import {
  DevHomeScreen,
} from "@/template/screens/dev/Dev-Home-Screen";

import {
  ServerSettingsScreen,
} from "@/template/screens/server/ServerSettings";

import {
  ChangePasswordScreen,
} from "@/template/screens/settings/ChangePassword";

import {
  NotificationsScreen,
} from "@/template/screens/Notification/NotificationsScreen";

import {
  UserProfileScreen,
} from "@/template/screens/UserProfile/UserProfileScreen";

import {
  MenuHubScreen,
} from "@/template/screens/menu/MenuHubScreen";

import {
  AppSettingsFileUploadScreen,
} from "@/template/screens/settings/AppSettingsFileUploadScreen";

import {
  LiveConsoleScreen,
} from "@/template/screens/liveConsole/LiveConsoleScreen";

import {
  UpdateGeneralTab,
} from "@/template/screens/update/tabs/UpdateGeneralTab";

import {
  UpdateWebAppTab,
} from "@/template/screens/update/tabs/UpdateWebAppTab";

import {
  UpdateBackendTab,
} from "@/template/screens/update/tabs/UpdateBackendTab";

export const templateScreenRegistry:
  ScreenRegistry = {
  "settings":
    SettingsScreen,

  "notifications":
    NotificationsScreen,

  "menu-hub":
    MenuHubScreen,

  "unauthenticated-settings":
    UnauthenticatedSettings,

  "privacy-settings":
    PrivacySettings,

  "user-profile":
    UserProfileScreen,

  "change-password":
    ChangePasswordScreen,

  "server-settings":
    ServerSettingsScreen,

  "update-general":
    UpdateGeneralTab,

  "update-web-app":
    UpdateWebAppTab,

  "update-backend":
    UpdateBackendTab,

  "live-console":
    LiveConsoleScreen,

  "dev-home":
    DevHomeScreen,

  "settings-file-upload":
    AppSettingsFileUploadScreen,
};