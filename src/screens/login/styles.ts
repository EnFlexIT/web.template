import { StyleSheet } from "react-native-unistyles";
import { StyleSheet as NativeStyleSheet } from "react-native";

export const styles = StyleSheet.create((theme) => ({
  loginRequestIndicatorContainer: {
    variants: {
      status: {
        loading: {},
        successful: { borderColor: "lightgreen" },
        failed: { borderColor: "red" },
      },
    },
    minWidth: 250,
    justifyContent: "space-around",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    flexDirection: "row",
  },

container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: 16,
    padding: 16,
  },

  widget: {
    padding: 12,
    backgroundColor: theme.colors.card,
    gap: 10,
    minWidth: 320,
    maxWidth: 420,
    width: "100%",
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 6,
  },

  padding: { padding: 5 },

  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  
  },

  upperHalf: { gap: 8 },
  lowerHalf: { gap: 8 },

  loginContainer: {
    variants: {
      highlight: {
        true: { backgroundColor: theme.colors.highlight },
      },
    },
    justifyContent: "center",
    alignItems: "center",
    minHeight: 42,
  },

  secondaryButton: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 42,
    backgroundColor: theme.colors.background,
  },

  login: {
    textAlign: "center",
    userSelect: "none",
    fontWeight: "800",
  },

  advancedSettingsTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
    paddingTop: 6,
  },

  advancedItemsContainer: {
    gap: 12,
    paddingTop: 6,
  },

  serverBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
  },

  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.background,
  },

  errorBorder: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12 },
}));

export const modalStyles = NativeStyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    width: 500,
    maxWidth: "100%",
    padding: 14,
    gap: 14,
  },
});

export const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
  },
});
