import React, { useEffect, useMemo,useState,} from "react";

import {Platform,Pressable,View,} from "react-native";

import {useTranslation,} from "react-i18next";

import {StyleSheet,useUnistyles,} from "react-native-unistyles";

import { Screen,} from "@/template/components/layout/Screen";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  H3,
} from "@/template/components/design-system/stylistic/H3";

import {
  H4,
} from "@/template/components/design-system/stylistic/H4";

import type {
  StaticMenuItem,
} from "@/template/navigation/menu/types";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  selectMenu,
  setActiveMenuId,
} from "@/template/state/navigation/menuSlice";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectAuthenticationMethod,
} from "@/template/state/api/apiSlice";

import {
  useMenuNavigation,
} from "@/template/navigation/routing/useMenuNavigation";

type ChildItem = StaticMenuItem;

function sortByPosition(
  a: StaticMenuItem,
  b: StaticMenuItem,
) {
  return (
    (a.position ?? 0) -
    (b.position ?? 0)
  );
}

type MenuHubCardProps = {
  title: string;
  description: string;
  onPress: () => void;
};

function MenuHubCard({
  title,
  description,
  onPress,
}: MenuHubCardProps) {
  const [
    isHovered,
    setIsHovered,
  ] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() =>
        setIsHovered(true)
      }
      onHoverOut={() =>
        setIsHovered(false)
      }
      style={({ pressed }) => [
        styles.cardPressable,

        Platform.OS === "web" &&
          styles.cardWebTransition,

        {
          transform: [
            {
              translateY:
                Platform.OS === "web" &&
                isHovered &&
                !pressed
                  ? -3
                  : 0,
            },
            {
              scale: pressed
                ? 0.99
                : Platform.OS ===
                      "web" &&
                    isHovered
                  ? 1.006
                  : 1,
            },
          ],
        },

        Platform.OS === "web" &&
          isHovered &&
          styles.cardHovered,
      ]}
    >
      <Card padding="lg">
        <H4>{title}</H4>

        <ThemedText
          style={{
            opacity: 0.85,
          }}
        >
          {description}
        </ThemedText>
      </Card>
    </Pressable>
  );
}

export function MenuHubScreen() {
  const { theme } =
    useUnistyles();

  const { t } =
    useTranslation([
      "Settings",
      "Drawer",
    ]);

  const dispatch =
    useAppDispatch();

  const { goTo } =
    useMenuNavigation();

  const authenticationMethod =
    useAppSelector(
      selectAuthenticationMethod,
    );

  const {
    activeMenuId,
  } = useAppSelector(
    selectMenu,
  );

  const {
    menu: menuConfiguration,
  } = getNavigationRuntime();

  useEffect(() => {
    if (activeMenuId) {
      dispatch(
        setActiveMenuId(
          activeMenuId,
        ),
      );
    }
  }, [
    activeMenuId,
    dispatch,
  ]);

  const enabledMenu =
    useMemo(
      () =>
        menuConfiguration.items
          .filter(
            (item) =>
              Boolean(
                item.menuID,
              ),
          )
          .filter((item) =>
            menuConfiguration.isEnabled(
              item.menuID,
              {
                authenticationMethod,
              },
            ),
          ),
      [
        menuConfiguration,
        authenticationMethod,
      ],
    );

  const currentItem =
    useMemo(
      () =>
        enabledMenu.find(
          (item) =>
            item.menuID ===
            activeMenuId,
        ) ?? null,
      [
        enabledMenu,
        activeMenuId,
      ],
    );

  const children:
    ChildItem[] =
    useMemo(() => {
      if (!activeMenuId) {
        return [];
      }

      return enabledMenu
        .filter(
          (item) =>
            item.parentID ===
            activeMenuId,
        )
        .sort(
          sortByPosition,
        );
    }, [
      enabledMenu,
      activeMenuId,
    ]);

  const hubKey =
    currentItem?.caption;

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
        <View
          style={{
            gap: 6,
          }}
        >
          <H3>
            {hubKey
              ? t(
                  `Drawer:${hubKey}`,
                )
              : t(
                  "Settings:title",
                )}
          </H3>

          <ThemedText
            style={{
              opacity: 0.85,
            }}
          >
            {hubKey
              ? t(
                  `Settings:cards.${hubKey}.description`,
                )
              : t(
                  "Settings:subtitle",
                )}
          </ThemedText>
        </View>

        <View
          style={
            styles.cardsRow
          }
        >
          {children.length ===
          0 ? (
            <Card padding="lg">
              <H4>
                {t(
                  "noChildren.title",
                  "Keine Unterpunkte",
                )}
              </H4>

              <ThemedText
                style={{
                  opacity: 0.85,
                }}
              >
                {t(
                  "noChildren.description",
                  "Für diesen Bereich sind keine weiteren Einstellungen vorhanden.",
                )}
              </ThemedText>
            </Card>
          ) : (
            children.map(
              (child) => (
                <MenuHubCard
                  key={
                    child.menuID
                  }
                  title={t(
                    `Drawer:${child.caption}`,
                  )}
                  description={t(
                    `Settings:cards.${child.caption}.description`,
                  )}
                  onPress={() =>
                    goTo(
                      child.menuID,
                    )
                  }
                />
              ),
            )
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles =
  StyleSheet.create(() => ({
    container: {
      flex: 1,
      padding: 24,
      gap: 24,
    },

    cardsRow: {
      gap: 12,
      flexDirection:
        "column",
      flexWrap: "wrap",
    },

    cardPressable: {
      width: "100%",
      borderRadius: 2,
    },

    cardWebTransition: {
      cursor: "pointer",
      transitionProperty:
        "transform, box-shadow",
      transitionDuration:
        "160ms",
      transitionTimingFunction:
        "ease-out",
    } as any,

    cardHovered: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 4,
    },
  }));