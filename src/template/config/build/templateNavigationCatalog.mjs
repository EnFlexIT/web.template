/**
 * Internal navigation definition of the Base Template.
 *
 * Concrete Applications must not depend on these IDs,
 * parent relationships or screen registry keys.
 *
 * Applications only enable or disable semantic features
 * through features.properties.
 */

export const templateMenuCatalog = {
  settings: {
    menuID: 3003,
    caption: "settings",
    screen: "settings",
  },

  notifications: {
    menuID: 3015,
    caption: "notifications",
    parent: "settings",
    screen: "notifications",
    feature: "notifications",
  },

  systemSettings: {
    menuID: 3021,
    caption: "SystemSettings",
    parent: "settings",
    screen: "menu-hub",
    container: true,
  },

  personalSettings: {
    menuID: 3022,
    caption: "personalSettings",
    parent: "settings",
    screen: "menu-hub",
    container: true,
  },

  appearance: {
    menuID: 3004,
    caption: "Appearance",
    parent: "personalSettings",
    screen: "unauthenticated-settings",
    feature: "appearance",
  },

  privacy: {
    menuID: 3005,
    caption: "privacysettings",
    parent: "personalSettings",
    screen: "privacy-settings",
    feature: "privacy",
  },

  userProfile: {
    menuID: 3025,
    caption: "UserProfile",
    parent: "personalSettings",
    screen: "user-profile",
    feature: "userProfile",
  },

  changePassword: {
    menuID: 3013,
    caption: "changePassword",
    parent: "personalSettings",
    screen: "change-password",
    feature: "changePassword",
  },

  serverSettings: {
    menuID: 3012,
    caption: "serverSettings",
    parent: "systemSettings",
    screen: "server-settings",
    feature: "serverSettings",
  },

  update: {
    menuID: 3014,
    caption: "appInfo",
    parent: "systemSettings",
    screen: "update-web-app",
    features: [
      "update.general",
      "update.webapp",
      "update.backend",
    ],
  },

  programStart: {
    menuID: 3023,
    caption: "options",
    parent: "systemSettings",
    position: 1,
    screen: "program-start",
    features: [
      "programStart",
      "dataAnalyzing",
    ],
  },

  liveConsole: {
    menuID: 3026,
    caption: "liveConsole",
    parent: "systemSettings",
    screen: "live-console",
    feature: "liveConsole",
  },

  database: {
    menuID: 3010,
    caption: "databaseConnectionsAndSettings",
    parent: "systemSettings",
    screen: "server-settings",
    features: [
      "database.general",
      "database.factory",
      "database.derby",
    ],
  },

  devHome: {
    menuID: 3011,
    caption: "devHome",
    parent: "settings",
    screen: "dev-home",
    feature: "devHome",
  },

  settingsFileUpload: {
    menuID: 3024,
    caption: "settingsFileUpload",
    parent: "systemSettings",
    screen: "settings-file-upload",
    feature: "settingsFileUpload",
  },
};

export const templateTabCatalog = {
  databaseGeneral: {
    menu: "database",
    tabKey: "general",
    caption: "General",
    position: 1,
    screen: "general-settings",
    feature: "database.general",
  },

  databaseFactory: {
    menu: "database",
    tabKey: "factory",
    caption: "Factory Settings",
    position: 2,
    screen: "factory-settings",
    feature: "database.factory",
  },

  databaseDerby: {
    menu: "database",
    tabKey: "derby",
    caption: "Derby Network Server",
    position: 3,
    screen: "derby-network-server",
    feature: "database.derby",
  },

  updateGeneral: {
    menu: "update",
    tabKey: "general",
    caption: "General",
    position: 1,
    screen: "update-general",
    feature: "update.general",
  },

  updateWebApp: {
    menu: "update",
    tabKey: "webapp",
    caption: "Web-App",
    position: 2,
    screen: "update-web-app",
    feature: "update.webapp",
  },

  updateBackend: {
    menu: "update",
    tabKey: "backend",
    caption: "Backend",
    position: 3,
    screen: "update-backend",
    feature: "update.backend",
  },

  programStart: {
    menu: "programStart",
    tabKey: "program-start",
    caption: "Program Start",
    position: 1,
    screen: "program-start",
    feature: "programStart",
  },

  dataAnalyzing: {
    menu: "programStart",
    tabKey: "data-analyzing",
    caption: "Data Analyzing",
    position: 2,
    screen: "data-analyzing",
    feature: "dataAnalyzing",

    runtimeFeatureID: 3000,
  },
};

/**
 * Runtime restrictions owned by the Base Template.
 *
 * These rules are technical Template behaviour and therefore
 * must not be repeated by every concrete Application.
 */
export const templateMenuRuntimeRules = {
  changePassword: {
    authExclude: [
      "oidc",
    ],
  },

  userProfile: {
    authInclude: [
      "oidc",
      "unset",
    ],
  },
};

export const templateTabRuntimeRules = {
  dataAnalyzing: {
    featureID: 3000,
    type: "stateEquals",
    statePath:
      "execSettings.appliedStartAs",
    value:
      "SERVER_MASTER",
  },
};