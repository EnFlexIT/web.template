import React from "react";
import { View } from "react-native";
import { Screen } from "../../../components/Screen";
import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";

export function UpdateGeneralTab() {
  return (
    <Card>
      <View style={{ gap: 8 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>General</ThemedText>
        <ThemedText style={{ opacity: 0.8 }}>
          Placeholder: Hier kommt später allgemeine Update-Übersicht rein (Status, letzte Checks, etc.).
        </ThemedText>
      </View>
    </Card>
  );
}