import { combineReducers } from "@reduxjs/toolkit";

import languageReducer from "./slices/languageSlice";
import themeReducer from "./slices/themeSlice";
import apiReducer from "./slices/apiSlice";
import dataPermissionsReducer from "./slices/dataPermissionsSlice";
import menuReducer from "./slices/menuSlice";
import readyReducer from "./slices/readySlice";
import { OrganizationsData } from "./slices/organizationsSlice";
import baseModeReducer from "./slices/baseModeSlice";
import serversReducer from "./slices/serverSlice";
import connectivityReducer from "./slices/connectivitySlice";
import dbSettingsReducer from "./slices/dbSettingsSlice";
import passwordChangePromptReducer from "./slices/passwordChangePromptSlice";
import notificationsReducer from "./slices/notificationSlice";
import execSettingsReducer from "./slices/execSettingsSlice";
import dataAnalysisReducer from "./slices/dataAnalysisSlice";
import updateReducer from "../core/redux/updateSlice";
import sessionTimeReducer from "./slices/sessionTimeSlice";
import serverStatusReducer from "./slices/serverStatusSlice";
import appSettingsFileUploadReducer from "./slices/appSettingsFileUploadSlice";
import appReleaseReducer from "./slices/appReleaseSlice";
import userProfileReducer from "./slices/userProfileSlice";
import liveConsoleReducer from "./slices/liveConsoleSlice";
import developerConsoleReducer from "./slices/developerConsoleSlice";

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