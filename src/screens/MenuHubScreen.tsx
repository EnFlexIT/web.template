// src/screens/MenuHubScreen.tsx
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ThemedText } from "../components/themed/ThemedText";
import { H3 } from "../components/stylistic/H3";
import { H4 } from "../components/stylistic/H4";

import { getStaticMenu, StaticMenuItem } from "../redux/slices/staticMenu";
import { isMenuEnabled } from "../redux/slices/featureFlags";
import { selectMenu, setActiveMenuId } from "../redux/slices/menuSlice";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import { useMenuNavigation } from "../components/routing/useMenuNavigation";

type ChildItem = StaticMenuItem;

function sortByPosition(a: StaticMenuItem, b: StaticMenuItem) {
  return (a.position ?? 0) - (b.position ?? 0);
}

export function MenuHubScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation(["Settings"]); // du kannst auch ["Drawer"] nehmen - je nach keys
  const dispatch = useAppDispatch();
  const { goTo } = useMenuNavigation();

  // wir lesen activeMenuId (weil hub-screen immer als "aktueller Ordner" fungiert)
  const { activeMenuId } = useAppSelector(selectMenu);

  //  activeMenuId sicher setzen (falls route geöffnet wurde)
  useEffect(() => {
    if (activeMenuId) dispatch(setActiveMenuId(activeMenuId));
  }, [activeMenuId, dispatch]);

  // static menu (bereits gefiltert, aber safety)
  const staticMenu = useMemo(() => getStaticMenu(), []);
  const enabledMenu = useMemo(
    () => staticMenu.filter((it) => it.menuID && isMenuEnabled(it.menuID)),
    [staticMenu]
  );

  //  aktuellen Knoten finden
  const currentItem = useMemo(() => {
    return enabledMenu.find((it) => it.menuID === activeMenuId) ?? null;
  }, [enabledMenu, activeMenuId]);

  // Kinder holen
  const children: ChildItem[] = useMemo(() => {
    if (!activeMenuId) return [];
    return enabledMenu
      .filter((it) => it.parentID === activeMenuId)
      .sort(sortByPosition);
  }, [enabledMenu, activeMenuId]);

  // Übersetzung-Keys: cards.<caption>.title/description
  // (Caption muss translation key sein! => keine Spaces/Uppercase)
  const hubKey = currentItem?.caption;

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={{ gap: 6 }}>
          <H3>
            {hubKey ? t(`cards.${hubKey}.title`) : t("title")}
          </H3>
          <ThemedText style={{ opacity: 0.85 }}>
            {hubKey ? t(`cards.${hubKey}.description`) : t("subtitle")}
          </ThemedText>
        </View>

        {/* Children Cards */}
        <View style={styles.cardsRow}>
          {children.length === 0 ? (
            <Card padding="lg">
              <H4>{t("noChildren.title", "Keine Unterpunkte")}</H4>
              <ThemedText style={{ opacity: 0.85 }}>
                {t("noChildren.description", "Für diesen Bereich sind keine weiteren Einstellungen vorhanden.")}
              </ThemedText>
            </Card>
          ) : (
            children.map((child) => (
              <Card
                padding="lg"
                key={child.menuID}
                onPress={() => goTo(child.menuID)}>
                <H4>{t(`cards.${child.caption}.title`)}</H4>
                <ThemedText style={{ opacity: 0.85 }}>
                  {t(`cards.${child.caption}.description`)}
                </ThemedText>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  cardsRow: {
    gap: 12,
    flexDirection: "column",
    flexWrap: "wrap",
  },
 
}));
