/**
 * Internal navigation definition of the Base Template.
 *
 * Concrete Applications must not depend on these IDs,
 * parent relationships or screen registry keys.
 *
 * Applications only enable or disable semantic features
 * through features.properties.
 *
 * Feature names follow a semantic hierarchy. Menu-level
 * gateFeature entries connect that semantic hierarchy to the
 * internal navigation tree owned by the Base Template.
 *
 * Menu positions are derived automatically from the order
 * of entries within the same parent.
 */
export const templateMenuCatalog = {
  settings: {
    menuID: 3003,
    caption: "settings",
    icon: "setting",
    screen: "settings",
    gateFeature: "settings",
  },

  notifications: {
    menuID: 3015,
    caption: "notifications",
    icon: "notification",
    parent: "settings",
    screen: "notifications",
    feature:
      "settings.notifications",
  },

  systemSettings: {
    menuID: 3021,
    caption: "SystemSettings",
    icon: "tool",
    parent: "settings",
    screen: "menu-hub",
    container: true,
    gateFeature:
      "settings.systemSettings",
  },

  personalSettings: {
    menuID: 3022,
    caption: "personalSettings",
    icon: "user",
    parent: "settings",
    screen: "menu-hub",
    container: true,
    gateFeature:
      "settings.personalSettings",
  },

  appearance: {
    menuID: 3004,
    caption: "Appearance",
    parent: "personalSettings",
    screen: "unauthenticated-settings",
    feature:
      "settings.personalSettings.appearance",
  },

  privacy: {
    menuID: 3005,
    caption: "privacysettings",
    parent: "personalSettings",
    screen: "privacy-settings",
    feature:
      "settings.personalSettings.privacy",
  },

  userProfile: {
    menuID: 3025,
    caption: "UserProfile",
    parent: "personalSettings",
    screen: "user-profile",
    feature:
      "settings.personalSettings.userProfile",
  },

  changePassword: {
    menuID: 3013,
    caption: "changePassword",
    parent: "personalSettings",
    screen: "change-password",
    feature:
      "settings.personalSettings.changePassword",
  },

  serverSettings: {
    menuID: 3012,
    caption: "serverSettings",
    parent: "systemSettings",
    screen: "server-settings",
    feature:
      "settings.systemSettings.serverSettings",
  },

  update: {
    menuID: 3014,
    caption: "appInfo",
    parent: "systemSettings",
    screen: "update-web-app",
    gateFeature:
      "settings.systemSettings.update",
    features: [
      "settings.systemSettings.update.general",
      "settings.systemSettings.update.webapp",
      "settings.systemSettings.update.backend",
    ],
  },

  programStart: {
    menuID: 3023,
    caption: "options",
    parent: "systemSettings",
    screen: "program-start",
    features: [
      "settings.systemSettings.programStart",
      "settings.systemSettings.programStart.dataAnalyzing",
    ],
  },

  liveConsole: {
    menuID: 3026,
    caption: "liveConsole",
    parent: "systemSettings",
    screen: "live-console",
    feature:
      "settings.systemSettings.liveConsole",
  },

  database: {
    menuID: 3010,
    caption:
      "databaseConnectionsAndSettings",
    parent: "systemSettings",
    screen: "server-settings",
    gateFeature:
      "settings.systemSettings.database",
    features: [
      "settings.systemSettings.database.general",
      "settings.systemSettings.database.factory",
      "settings.systemSettings.database.derby",
    ],
  },

  devHome: {
    menuID: 3011,
    caption: "devHome",
    parent: "settings",
    screen: "dev-home",
    feature:
      "settings.devHome",
  },

  settingsFileUpload: {
    menuID: 3024,
    caption: "settingsFileUpload",
    parent: "systemSettings",
    screen: "settings-file-upload",
    feature:
      "settings.systemSettings.settingsFileUpload",
  },
};

export const templateTabCatalog = {
  databaseGeneral: {
    menu: "database",
    tabKey: "general",
    caption: "General",
    position: 1,
    screen: "general-settings",
    feature:
      "settings.systemSettings.database.general",
  },

  databaseFactory: {
    menu: "database",
    tabKey: "factory",
    caption: "Factory Settings",
    position: 2,
    screen: "factory-settings",
    feature:
      "settings.systemSettings.database.factory",
  },

  databaseDerby: {
    menu: "database",
    tabKey: "derby",
    caption: "Derby Network Server",
    position: 3,
    screen: "derby-network-server",
    feature:
      "settings.systemSettings.database.derby",
  },

  updateGeneral: {
    menu: "update",
    tabKey: "general",
    caption: "Update:general.title",
    position: 1,
    screen: "update-general",
    feature:
      "settings.systemSettings.update.general",
  },

  updateWebApp: {
    menu: "update",
    tabKey: "webapp",
    caption: "Update:serverWeb.title",
    position: 2,
    screen: "update-web-app",
    feature:
      "settings.systemSettings.update.webapp",
  },

  updateBackend: {
    menu: "update",
    tabKey: "backend",
    caption: "Update:backend.title",
    position: 3,
    screen: "update-backend",
    feature:
      "settings.systemSettings.update.backend",
  },

  liveConsoleConsole: {
    menu: "liveConsole",
    tabKey: "console",
    caption:
      "liveConsole:tabs.console",
    position: 1,
    // layout: "wide",
    screen: "live-console",
    feature:
      "settings.systemSettings.liveConsole",
  },

  liveConsoleFiles: {
    menu: "liveConsole",
    tabKey: "files",
    caption:
      "liveConsole:tabs.files",
    position: 2,
    // layout: "wide",
    screen: "log-files",
    feature:
      "settings.systemSettings.liveConsole",
  },

  programStart: {
    menu: "programStart",
    tabKey: "program-start",
    caption: "Program Start",
    position: 1,
    screen: "program-start",
    feature:
      "settings.systemSettings.programStart",
  },

  dataAnalyzing: {
    menu: "programStart",
    tabKey: "data-analyzing",
    caption: "Data Analyzing",
    position: 2,
    screen: "data-analyzing",
    feature:
      "settings.systemSettings.programStart.dataAnalyzing",
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
