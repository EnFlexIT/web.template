import { combineReducers } from "@reduxjs/toolkit";

import languageReducer from "@/template/state/localization/languageSlice";
import themeReducer from "@/template/state/theme/themeSlice";
import apiReducer from "@/template/state/api/apiSlice";
import dataPermissionsReducer from "@/template/state/privacy/dataPermissionsSlice";
import menuReducer from "@/template/state/navigation/menuSlice";
import readyReducer from "@/template/state/bootstrap/readySlice";
import { OrganizationsData } from "@/template/state/organizations/organizationsSlice";
import baseModeReducer from "@/template/state/mode/baseModeSlice";
import serversReducer from "@/template/state/server/serverSlice";
import connectivityReducer from "@/template/state/connectivity/connectivitySlice";
import dbSettingsReducer from "@/template/state/settings/database/dbSettingsSlice";
import passwordChangePromptReducer from "@/template/state/authentication/passwordChangePromptSlice";
import notificationsReducer from "@/template/state/notifications/notificationSlice";
import execSettingsReducer from "@/template/state/agent-workbench/execSettingsSlice";
import dataAnalysisReducer from "@/template/state/agent-workbench/dataAnalysisSlice";
import updateReducer from "@/template/state/update/updateSlice";
import sessionTimeReducer from "./slices/sessionTimeSlice";
import serverStatusReducer from "@/template/state/server/serverStatusSlice";
import appSettingsFileUploadReducer from "@/template/state/settings/appSettingsFileUploadSlice";
import appReleaseReducer from "@/template/state/release/appReleaseSlice";
import userProfileReducer from "@/template/state/authentication/userProfileSlice";
import liveConsoleReducer from "@/template/state/developer-tools/liveConsoleSlice";
import developerConsoleReducer from "@/template/state/developer-tools/developerConsoleSlice";

export const rootReducer = combineReducers({
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
  execSettings: execSettingsReducer,
  dataAnalysis: dataAnalysisReducer,
  update: updateReducer,
  sessionTime: sessionTimeReducer,
  serverStatus: serverStatusReducer,
  appSettingsFileUpload: appSettingsFileUploadReducer,
  appRelease: appReleaseReducer,
  userProfile: userProfileReducer,
  liveConsole: liveConsoleReducer,
  developerConsole: developerConsoleReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

