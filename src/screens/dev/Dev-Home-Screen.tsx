// src/screens/dev/DevHomeScreen.tsx
import React, { useMemo } from "react";
import { Text, View, ScrollView, Image, ImageBackground, Platform } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Card } from "../../components/ui-elements/Card";
import { MetricCard } from "../../components/ui-elements/MetricCard";
import { SmallStat } from "../../components/ui-elements/SmallStat";
import { HeroCard } from "../../components/ui-elements/HeroCard";
export function DevHomeScreen() {
  const SOLAR_PANEL_IMG = require("../../../assets/solar.png");
  const SMART_HOME_IMG = require("../../../assets/Smarthome.png");

  const headerImageSource = useMemo(() => (SOLAR_PANEL_IMG ? SOLAR_PANEL_IMG : undefined), [SOLAR_PANEL_IMG]);
  const smartHomeImageSource = useMemo(() => (SMART_HOME_IMG ? SMART_HOME_IMG : undefined), [SMART_HOME_IMG]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <HeroCard
        title="Solar Panel"
        subtitle="High energy generating"
        badgeIcon="🔋"
        badgeText="67% Battery"
        imageSource={headerImageSource}
        imageFallbackIcon="☀️"
        imageFallbackText="Solar Visual"
      />

      <View style={styles.row2}>
        <MetricCard title="Current Power" subtitle="Generation" value="152.84 kW" icon="⚡" />
        <MetricCard title="Current Grid" subtitle="Power supply" value="32.84 kW" icon="🏗️" />
      </View>

      <View style={styles.smartHomeWrapper}>
        <View style={styles.flowLineLeft} />
        <View style={styles.flowLineRight} />

<Card
  style={styles.smartHomeCard}
  padding="none"
  contentStyle={styles.smartHomeContent}
>
  {smartHomeImageSource ? (
    <Image
      source={smartHomeImageSource}
      resizeMode="contain"
      style={styles.smartHomeImg}
    />
  ) : (
    <View style={styles.smartHomePlaceholder}>
      <Text style={styles.placeholderEmoji}>🏠</Text>
      <Text style={styles.placeholderText}>Smart Home Visual</Text>
      <Text style={styles.placeholderHint}>(setze SMART_HOME_IMG als Asset)</Text>
    </View>
  )}
</Card>


      </View>

      <View style={styles.row3}>
        <SmallStat label="Load" value="30.59 kW" icon="🔌" />
        <SmallStat label="EVSE" value="26.71 kW" icon="🚗" />
        <SmallStat label="Battery" value="11.6 kW" icon="🟨" />
      </View>

      <Card padding="sm">
        <Text style={styles.devNoteTitle}>Dev Home</Text>
        <Text style={styles.devNoteText}>
          Diese Seite ist bewusst “statisch”, damit du Komponenten (Cards, Layout, Theme) realistisch testen kannst
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.background,
  },

  row2: { flexDirection: "row", gap: 12 },

  smartHomeWrapper: {
    position: "relative",
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },


smartHomeCard: {
  borderRadius: 22,
  overflow: "hidden",
  width: "100%",        
},

smartHomeContent: {
  height: 300,            // Card-Inhalt bekommt feste Höhe
  padding: 0,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.colors.card,
},

smartHomeImg: {
  width: "100%",
  height: "100%",
},
smartHomePlaceholder: {
  width: "100%",
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

  flowLineLeft: {
    position: "absolute",
    top: 10,
    left: 28,
    width: 2,
    height: 80,
    backgroundColor: theme.colors.border,
    opacity: 0.6,
    borderRadius: 2,
  },

  flowLineRight: {
    position: "absolute",
    top: 10,
    right: 28,
    width: 2,
    height: 80,
    backgroundColor: theme.colors.border,
    opacity: 0.6,
    borderRadius: 2,
  },

  row3: { flexDirection: "row", gap: 12 },

  placeholderEmoji: { fontSize: 22 },
  placeholderText: { color: theme.colors.text, fontSize: 13, fontWeight: "700", opacity: 0.9 },
  placeholderHint: { color: theme.colors.text, fontSize: 12, opacity: 0.65, textAlign: "center" },

  devNoteTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  devNoteText: {
    color: theme.colors.text,
    opacity: 0.75,
    fontSize: 13,
    lineHeight: Platform.select({ web: 18, default: 18 }),
  },
}));
