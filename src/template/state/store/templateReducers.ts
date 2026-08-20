import languageReducer from "@/template/state/localization/languageSlice";
import themeReducer from "@/template/state/theme/themeSlice";
import apiReducer from "@/template/state/api/apiSlice";
import dataPermissionsReducer from "@/template/state/privacy/dataPermissionsSlice";
import menuReducer from "@/template/state/navigation/menuSlice";
import readyReducer from "@/template/state/bootstrap/readySlice";
import {
  OrganizationsData,
} from "@/template/state/organizations/organizationsSlice";
import baseModeReducer from "@/template/state/mode/baseModeSlice";
import serversReducer from "@/template/state/server/serverSlice";
import connectivityReducer from "@/template/state/connectivity/connectivitySlice";
import dbSettingsReducer from "@/template/state/settings/database/dbSettingsSlice";
import passwordChangePromptReducer from "@/template/state/authentication/passwordChangePromptSlice";
import notificationsReducer from "@/template/state/notifications/notificationSlice";
import updateReducer from "@/template/state/update/updateSlice";
import sessionTimeReducer from "@/template/state/session/sessionTimeSlice";
import serverStatusReducer from "@/template/state/server/serverStatusSlice";
import appSettingsFileUploadReducer from "@/template/state/settings/appSettingsFileUploadSlice";
import appReleaseReducer from "@/template/state/release/appReleaseSlice";
import userProfileReducer from "@/template/state/authentication/userProfileSlice";
import liveConsoleReducer from "@/template/state/developer-tools/liveConsoleSlice";
import developerConsoleReducer from "@/template/state/developer-tools/developerConsoleSlice";

/**
 * Reducers owned by the reusable Base Template.
 *
 * Application-specific reducers must not be added here.
 */
export const templateReducers = {
  language: languageReducer,
  theme: themeReducer,
  api: apiReducer,
  dataPermissions: dataPermissionsReducer,
  menu: menuReducer,
  organizations: OrganizationsData.slice.reducer,
  ready: readyReducer,
  baseMode: baseModeReducer,
  servers: serversReducer,
  connectivity: connectivityReducer,
  dbSettings: dbSettingsReducer,
  passwordChangePrompt: passwordChangePromptReducer,
  notifications: notificationsReducer,
  update: updateReducer,
  sessionTime: sessionTimeReducer,
  serverStatus: serverStatusReducer,
  appSettingsFileUpload: appSettingsFileUploadReducer,
  appRelease: appReleaseReducer,
  userProfile: userProfileReducer,
  liveConsole: liveConsoleReducer,
  developerConsole: developerConsoleReducer,
};
/**
 * State owned by the reusable Base Template.
 *
 * Application-specific state is intentionally not included here.
 */
export type TemplateRootState = {
  [K in keyof typeof templateReducers]:
    ReturnType<
      (typeof templateReducers)[K]
    >;
};