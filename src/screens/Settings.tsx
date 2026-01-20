import React from "react";
import { View } from "react-native";
import { useLinkTo } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "../components/stylistic/Text";
import { Card } from "../components/ui-elements/Card";

type SettingCard = {
  key: "db" | "general" | "privacy";
  route: string;
};

export function SettingsScreen() {
  const linkTo = useLinkTo();
  const { theme } = useUnistyles();
const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };

  // Namespace "Settings" ( keys in i18n ergänzen)
  const { t } = useTranslation(["Settings"]);
//Für neue SettingCard einfach hier fügen :
  const cards: SettingCard[] = [
    { key: "db", route: "/3010" },
    { key: "general", route: "/3004" },
    { key: "privacy", route: "/3005" },
   
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
          {t("title")}
        </Text>
        <Text style={[styles.pageSubTitle, mutedTextStyle]}>
          {t("subtitle")}
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>
        {cards.map((c) => (
          <Card
            key={c.key}
            padding="sm"
            onPress={() => linkTo(c.route)}
            contentStyle={styles.cardContent}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              {t(`cards.${c.key}.title`)}
            </Text>

            <Text
               style={[styles.cardDescription, mutedTextStyle]}
            >
              {t(`cards.${c.key}.description`)}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  pageSubTitle: {
    fontSize: 13,
    opacity: 0.85,
  },
  cardsRow: {
    gap: 12,
    flexDirection: "column-reverse",
    flexWrap: "wrap",
  },
  card: {
    minWidth: 240,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.85,
  },
}));
