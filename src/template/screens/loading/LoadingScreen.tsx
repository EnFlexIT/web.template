import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/template/components/layout/Screen";

export function LoadingScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
}));