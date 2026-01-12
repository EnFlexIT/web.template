// src/screens/dev/DevHomeScreen.styles.ts
import { StyleSheet } from "react-native-unistyles";
import { Platform } from "react-native";

export const devHomeStyles = StyleSheet.create((theme) => ({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.background,
  },

  /* ===== Rows ===== */
  row2: {
    flexDirection: "row",
    gap: 12,
  },

  row3: {
    flexDirection: "row",
    gap: 12,
  },

  /* ===== Smart Home ===== */
  smartHomeWrapper: {
    position: "relative",
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },

  smartHomeCard: {
    borderRadius: 22,
    overflow: "hidden", // wichtig für Bilder
  },

  smartHomeMedia: {
    width: "100%",
    height: 300,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },

  smartHomeImg: {
    width: "100%",
    height: "100%",
  },

  smartHomePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
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

  /* ===== Placeholders ===== */
  placeholderEmoji: {
    fontSize: 22,
  },

  placeholderText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },

  placeholderHint: {
    color: theme.colors.text,
    fontSize: 12,
    opacity: 0.65,
    textAlign: "center",
  },

  /* ===== Dev Note ===== */
  devNoteTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },

  devNoteText: {
    color: theme.colors.text,
    opacity: 0.75,
    fontSize: 13,
    lineHeight: Platform.select({ web: 18, default: 18 }),
  },
}));
