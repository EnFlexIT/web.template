import {
  ScrollView,
  View,
} from "react-native";

import {
  useState,
} from "react";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  TabsBar,
} from "@design-system";

import {
  AssetsExampleTab,
} from "./example/tabs/AssetsExampleTab";

import {
  OverviewExampleTab,
} from "./example/tabs/OverviewExampleTab";
import {
  ComponentsExampleTab,
} from "./example/tabs/ComponentsExampleTab";

import {
  NavigationExampleTab,
} from "./example/tabs/NavigationExampleTab";
import { LayoutExampleTab } from "./example/tabs/LayoutExampleTab";

import { ConfigurationExampleTab } from "./example/tabs/ConfigurationExampleTab";
type ExampleTabKey =
  | "overview"
  | "assets"
  | "components"
  | "navigation"
  | "configuration"
  | "layout";

const exampleTabs = [
  {
    key: "overview",
    label: "Overview",
  },
  {
    key: "assets",
    label: "Assets",
  },
  {
    key: "components",
    label: "Components",
  },
  {
    key: "navigation",
    label: "Navigation",
  },
  {
    key: "configuration",
    label: "Configuration",
  },
  {
    key: "layout",
    label: "Layout",
  },
] as const;

export function ExampleScreen() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ExampleTabKey>(
      "overview",
    );

  return (
    <View
      style={
        styles.container
      }
    >
      <TabsBar
        items={
          exampleTabs
        }
        activeKey={
          activeTab
        }
        onChange={
          setActiveTab
        }
      />

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.content
        }
      >
        {activeTab ===
        "overview" ? (
          <OverviewExampleTab />
        ) : null}

        {activeTab ===
        "assets" ? (
          <AssetsExampleTab />
        ) : null}

        {activeTab ===
        "components" ? (
          <ComponentsExampleTab />
        ) : null}

        {activeTab ===
        "navigation" ? (
          <NavigationExampleTab />
        ) : null}

        {activeTab ===
        "configuration" ? (
          <ConfigurationExampleTab />
        ) : null}

        {activeTab ===
        "layout" ? (
          <LayoutExampleTab />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create(() => ({
    container: {
      flex: 1,
      width: "100%",
      padding: 24,
      gap: 16,
    },

    scrollView: {
      flex: 1,
    },

    content: {
      paddingBottom: 32,
    },
  }));