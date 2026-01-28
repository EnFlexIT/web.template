import React from "react";
import { View } from "react-native";
import { useLinkTo } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { H2 } from "../components/stylistic/H2";
import { H4 } from "../components/stylistic/H4";
import { H3 } from "../components/stylistic/H3"; 
import { Card } from "../components/ui-elements/Card";
import { Screen } from "../components/Screen";

type SettingCard = {
  key: "general" | "privacy" | "db"|"ServerModal";
  route: string;
};

export function SettingsScreen() {
  const linkTo = useLinkTo();
  const { theme } = useUnistyles();


  // Namespace "Settings" ( keys in i18n ergänzen)
  const { t } = useTranslation(["Settings"]);
//Für neue SettingCard einfach hier fügen :
  const cards: SettingCard[] = [
     { key: "db", route: "/3010" },
    { key: "privacy", route: "/3005" },
     { key: "general", route: "/3004" }, 
     { key: "ServerModal", route: "/3004" }, 
  ];

  return (
    <Screen>
    <View style={[styles.container, { backgroundColor: theme.colors.background, }]}>
     
      {/* Header */}
      <View >
        <H2>
          {t("title")}
        </H2>
        <H4>
          {t("subtitle")}
        </H4>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>
        {cards.map((c) => (
          <Card
            key={c.key}
            padding="sm"
            onPress={() => linkTo(c.route)}
           
            style={[
            
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                width: "100%",
              },
            ]}
          >
            <H3>
              {t(`cards.${c.key}.title`)}
            </H3>

            <H4 >
              {t(`cards.${c.key}.description`)}
            </H4>
          </Card>
        ))}
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
    flexDirection: "column-reverse",
    flexWrap: "wrap",
  },

 
}));
