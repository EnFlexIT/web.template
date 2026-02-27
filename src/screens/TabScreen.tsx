import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { TabsBar } from "../components/ui-elements/TabsBar";

import { useAppSelector } from "../hooks/useAppSelector";
import { selectMenu } from "../redux/slices/menuSlice";

import { getTabsForMenu, TabContent} from "../redux/slices/staticTabs";

function renderContent(Content: TabContent) {
  const isFactoryFn = typeof Content === "function" && (Content as any).prototype == null;
  if (isFactoryFn) return (Content as () => React.ReactNode)();
  return React.createElement(Content as any);
}

export function TabScreen() {
  const { theme } = useUnistyles();
  const { activeMenuId } = useAppSelector(selectMenu);

  const tabs = useMemo(() => (activeMenuId ? getTabsForMenu(activeMenuId) : []), [activeMenuId]);
  const items = useMemo(() => tabs.map((t) => ({ key: t.tabKey, label: t.caption })), [tabs]);

  const [activeKey, setActiveKey] = useState<string | null>(items[0]?.key ?? null);

  useEffect(() => {
    setActiveKey(items[0]?.key ?? null);
  }, [activeMenuId, items]);

  const activeTab = useMemo(
    () => (activeKey ? tabs.find((t) => t.tabKey === activeKey) ?? null : null),
    [tabs, activeKey]
  );

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {items.length === 0 ? (
          <View />
        ) : (
          <>
            <TabsBar items={items} activeKey={(activeKey ?? items[0].key) as any} onChange={setActiveKey} />
            <View style={styles.content}>{activeTab?.Content ? renderContent(activeTab.Content) : null}</View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: { flex: 1, padding: 24, gap: 16 },
  content: { paddingTop: 12 },
}));