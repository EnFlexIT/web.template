import "./unistyles";
import "./i18n";
import "@expo/metro-runtime";

import React from "react";

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

import {
  ContentMenuEditorPreviewApp,
} from "./src/template/editor/screens/ContentMenuEditorPreviewApp";

const ProductionApp =
  createTemplateApp(
    applicationConfig,
    {
      store: applicationStore,
    },
  );

const isEditorPreview =
  __DEV__ &&
  process.env.EXPO_PUBLIC_CONTENT_EDITOR_PREVIEW === "1";

function App() {
  if (isEditorPreview) {
    return (
      React.createElement(
        ContentMenuEditorPreviewApp,
        {
          applicationId: applicationConfig.id,
        },
      )
    );
  }

  return React.createElement(ProductionApp);
}

registerRootComponent(App);
