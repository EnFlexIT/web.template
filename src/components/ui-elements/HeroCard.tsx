// src/components/ui-elements/Dashboard/HeroCard.tsx
import React from "react";
import { Text, View, Image, ImageSourcePropType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "./Card";

type HeroCardProps = {
  title: string;
  subtitle?: string;

  badgeIcon?: string;   // z.B. 🔋
  badgeText?: string;   // z.B. 67% Battery

  imageSource?: ImageSourcePropType;
  imageFallbackIcon?: string; // z.B. ☀️
  imageFallbackText?: string; // z.B. Solar Visual

  /** optional */
  rightImageWidth?: number; // default 140
};

export function HeroCard({
  title,
  subtitle,
  badgeIcon,
  badgeText,
  imageSource,
  imageFallbackIcon = "✨",
  imageFallbackText = "Visual",
  rightImageWidth = 140,
}: HeroCardProps) {
  return (
    <Card style={styles.card} padding="md">
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {!!badgeText && (
            <View style={styles.badge}>
              {!!badgeIcon && <Text style={styles.badgeIcon}>{badgeIcon}</Text>}
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>

        <View style={[styles.right, { width: rightImageWidth }]}>
          {imageSource ? (
            <Image source={imageSource} resizeMode="contain" style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>{imageFallbackIcon}</Text>
              <Text style={styles.placeholderText}>{imageFallbackText}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {},

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: {
    flex: 1,
    gap: 6,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },

  subtitle: {
    color: theme.colors.text,
    opacity: 0.7,
    fontSize: 14,
  },

  badge: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: "flex-start",
  },

  badgeIcon: { fontSize: 16 },

  badgeText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  image: {
    width: 130,
    height: 80,
  },

  imagePlaceholder: {
    width: 130,
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  placeholderEmoji: { fontSize: 22 },

  placeholderText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },
}));
