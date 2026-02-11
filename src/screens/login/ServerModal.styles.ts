import { StyleSheet } from "react-native-unistyles";
import { StyleSheet as NativeStyleSheet } from "react-native";

export const serverModalStyles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    
    padding: 16,
    gap: 14,
    width: 500,
    maxWidth: "100%",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  section: { gap: 12 },

  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
  
  },

  errorBorder: { borderColor: "red" },

  statusSlot: {
    minHeight: 34,
    justifyContent: "center",
  },

  statusInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  statusText: { fontSize: 12, opacity: 0.9 },

  statusPlaceholder: { fontSize: 12, opacity: 0 },

  errorText: {
    color: "red",
    fontSize: 12,
    lineHeight: 16,
  },

  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

export const serverModalNative = NativeStyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
