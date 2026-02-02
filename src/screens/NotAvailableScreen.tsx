import React from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { H1 } from "../components/stylistic/H1";
import { ThemedText } from "../components/themed/ThemedText";

export function NotAvailableScreen() {
  return (
    <Screen>
      <Card style={{ maxWidth: 520 }}>
        <H1>In Bearbeitung</H1>
        <View style={{ height: 10 }} />
        <ThemedText>
          Dieser Bereich ist aktuell in Bearbeitung und daher vorübergehend nicht verfügbar.
        </ThemedText>
      </Card>
    </Screen>
  );
}
