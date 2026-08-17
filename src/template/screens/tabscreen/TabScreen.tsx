import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
} from "react-native";

import {
  StyleSheet,
  useUnistyles,
} from "react-native-unistyles";

import {
  Screen,
} from "@/template/components/layout/Screen";

import {
  TabsBar,
} from "@/template/components/design-system/ui-elements/TabsBar";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectMenu,
} from "@/template/state/navigation/menuSlice";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import type {
  TabContent,
} from "@/template/navigation/tabs/types";

type TabScreenProps = {
  menuID?: number;
};

function renderContent(
  Content: TabContent,
) {
  const isFactoryFn =
    typeof Content === "function" &&
    (Content as any).prototype == null;

  if (isFactoryFn) {
    return (
      Content as () => React.ReactNode
    )();
  }

  return React.createElement(
    Content as any,
  );
}

export function TabScreen({
  menuID,
}: TabScreenProps) {
  const { theme } =
    useUnistyles();

  const {
    activeMenuId,
  } = useAppSelector(
    selectMenu,
  );

  const state =
    useAppSelector(
      (currentState) =>
        currentState,
    );

  const effectiveMenuId =
    menuID ?? activeMenuId;

  const {
    tabs: tabConfiguration,
  } = getNavigationRuntime();

  const tabs =
    useMemo(() => {
      if (!effectiveMenuId) {
        return [];
      }

      return tabConfiguration.items
        .filter(
          (tab) =>
            tab.menuID ===
            effectiveMenuId,
        )
        .filter((tab) => {
          if (
            tab.featureID ===
            undefined
          ) {
            return true;
          }

          return (
            tabConfiguration.isEnabled(
              tab.featureID,
              {
                state,
              },
            )
          );
        })
        .sort(
          (a, b) =>
            (a.position ?? 0) -
            (b.position ?? 0),
        );
    }, [
      effectiveMenuId,
      state,
      tabConfiguration,
    ]);

  const items =
    useMemo(
      () =>
        tabs.map(
          (tab) => ({
            key: tab.tabKey,
            label: tab.caption,
          }),
        ),
      [tabs],
    );

  const [
    activeKey,
    setActiveKey,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      items.length === 0
    ) {
      setActiveKey(null);
      return;
    }

    const stillExists =
      items.some(
        (item) =>
          item.key ===
          activeKey,
      );

    if (
      !activeKey ||
      !stillExists
    ) {
      setActiveKey(
        items[0].key,
      );
    }
  }, [
    items,
    activeKey,
  ]);

  const activeTab =
    useMemo(() => {
      if (!activeKey) {
        return null;
      }

      return (
        tabs.find(
          (tab) =>
            tab.tabKey ===
            activeKey,
        ) ?? null
      );
    }, [
      tabs,
      activeKey,
    ]);

  const tabsKey =
    useMemo(
      () =>
        items
          .map(
            (item) =>
              item.key,
          )
          .join("-"),
      [items],
    );

  return (
    <Screen>
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              theme.colors
                .background,
          },
        ]}
      >
        {items.length === 0 ? (
          <View
            style={
              styles.emptyWrap
            }
          >
            <TabsDebugText
              text={`Keine Tabs verfügbar (menuID=${String(
                effectiveMenuId,
              )})`}
            />
          </View>
        ) : (
          <>
            <TabsBar
              key={`tabs-${effectiveMenuId}-${tabsKey}`}
              items={items}
              activeKey={
                activeKey ??
                items[0].key
              }
              onChange={
                setActiveKey
              }
            />

            <View
              style={
                styles.content
              }
              key={`content-${effectiveMenuId}-${activeKey}`}
            >
              {activeTab?.Content
                ? renderContent(
                    activeTab.Content,
                  )
                : null}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function TabsDebugText({
  text,
}: {
  text: string;
}) {
  return null;
}

const styles =
  StyleSheet.create(() => ({
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
      justifyContent:
        "center",
      alignItems:
        "center",
    },
  }));