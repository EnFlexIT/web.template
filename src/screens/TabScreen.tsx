import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { TabsBar } from "../components/ui-elements/TabsBar";

import { useAppSelector } from "../hooks/useAppSelector";
import { selectMenu } from "../redux/slices/menuSlice";

import { getTabsForMenu, TabContent } from "../redux/slices/staticTabs";

type TabScreenProps = {
  menuID?: number;
};

function renderContent(Content: TabContent) {
  const isFactoryFn =
    typeof Content === "function" && (Content as any).prototype == null;

  if (isFactoryFn) {
    return (Content as () => React.ReactNode)();
  }

  return React.createElement(Content as any);
}

export function TabScreen({ menuID }: TabScreenProps) {
  const { theme } = useUnistyles();

  const { activeMenuId } = useAppSelector(selectMenu);
  const execMode = useAppSelector(
    (state) => state.execSettings.settings.startAs,
  );
  const state = useAppSelector((state) => state);

  const effectiveMenuId = menuID ?? activeMenuId;

  const tabs = useMemo(() => {
    if (!effectiveMenuId) return [];

    return getTabsForMenu(effectiveMenuId, state);
  }, [effectiveMenuId, execMode, state]);

  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.tabKey,
        label: tab.caption,
      })),
    [tabs],
  );

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setActiveKey(null);
      return;
    }

    const stillExists = items.some((item) => item.key === activeKey);

    if (!activeKey || !stillExists) {
      setActiveKey(items[0].key);
    }
  }, [items, activeKey]);

  const activeTab = useMemo(() => {
    if (!activeKey) return null;

    return tabs.find((tab) => tab.tabKey === activeKey) ?? null;
  }, [tabs, activeKey]);

  return (
    <Screen>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <TabsDebugText
              text={`Keine Tabs verfügbar (menuID=${String(effectiveMenuId)})`}
            />
          </View>
        ) : (
          <>
            <TabsBar
              key={`tabs-${effectiveMenuId}-${execMode}`}
              items={items}
              activeKey={activeKey ?? items[0].key}
              onChange={setActiveKey}
            />

            <View
              style={styles.content}
              key={`content-${effectiveMenuId}-${activeKey}`}
            >
              {activeTab?.Content ? renderContent(activeTab.Content) : null}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function TabsDebugText({ text }: { text: string }) {
  return null;
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },

  content: {
    paddingTop: 12,
    flex: 1,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));