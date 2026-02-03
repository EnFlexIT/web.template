import React from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { H1 } from "../components/stylistic/H1";
import { ThemedText } from "../components/themed/ThemedText";
import { useUnistyles } from "react-native-unistyles";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from "react-i18next";

export function NotAvailableScreen() {
    const { theme } = useUnistyles();
    const { t } = useTranslation(["NotAvailable"]);
  return (
    <Screen>
      <Card style={{ maxWidth: 520 }}>
        <H1>{t("notAvailableTitle")}</H1>
        <View style={{flexDirection: "row", alignItems: "center" ,  justifyContent: "space-between"}} >
        <ThemedText  >
          {t("notAvailableMessage")}
        </ThemedText>
      
       <Ionicons name="cloud-offline-outline" size={50} color={theme.colors.text} />
       </View>
      </Card>
    </Screen>
  );
}
