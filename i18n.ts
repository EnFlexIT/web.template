import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    Login: require("./assets/locales/en/Login.json"),
    Drawer: require("./assets/locales/en/Drawer.json"),
    "Settings.ChangePassword": require("./assets/locales/en/Settings.ChangePassword.json"),
    "Settings.PrivacySecurity": require("./assets/locales/en/Settings.PrivacySecurity.json"),
    "Settings.Unauthenticated": require("./assets/locales/en/Settings.Unauthenticated.json"),
    Home: require("./assets/locales/en/Home.json"),
    DataPermissions: require("./assets/locales/en/DataPermission.json"),
    Settings: require("./assets/locales/en/Settings.json"),
    DevHome: require("./assets/locales/en/DevHome.json"),
    NotAvailable: require("./assets/locales/en/NotAvailable.json"),
    Update: require("./assets/locales/en/Update.json"),
    Notifications: require("./assets/locales/en/Notification.json"),
    DataBase: require("./assets/locales/en/DataBase.json"),
  },
  de: {
    Login: require("./assets/locales/de/Login.json"),
    Drawer: require("./assets/locales/de/Drawer.json"),
    "Settings.ChangePassword": require("./assets/locales/de/Settings.ChangePassword.json"),
    "Settings.PrivacySecurity": require("./assets/locales/de/Settings.PrivacySecurity.json"),
    "Settings.Unauthenticated": require("./assets/locales/de/Settings.Unauthenticated.json"),
    Home: require("./assets/locales/de/Home.json"),
    DataPermissions: require("./assets/locales/de/DataPermission.json"),
    Settings: require("./assets/locales/de/Settings.json"),
    DevHome: require("./assets/locales/de/DevHome.json"),
    NotAvailable: require("./assets/locales/de/NotAvailable.json"),
    Update: require("./assets/locales/de/Update.json"),
    Notifications: require("./assets/locales/de/Notification.json"),
    DataBase: require("./assets/locales/de/DataBase.json"),
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "de",
    fallbackLng: "de",
    supportedLngs: ["en", "de"],
    compatibilityJSON: "v4",
    interpolation: {
      escapeValue: false,
    },
    debug: true,
  });

export default i18n;