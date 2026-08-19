import "./unistyles";
import "./i18n";
import "@expo/metro-runtime";

import {
  registerRootComponent,
} from "expo";

import {
  applicationConfig,
  applicationStore,
} from "./src/application";

import {
  createTemplateApp,
} from "./src/template/application/createTemplateApp";

const App =
  createTemplateApp(
    applicationConfig,
    {
      store: applicationStore,
    },
  );

registerRootComponent(App);