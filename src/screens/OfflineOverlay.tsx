import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  checkAlive,
  dismissBackOnline,
  selectConnectivity,
} from "../redux/slices/connectivitySlice";

function Dot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export function OfflineOverlay() {
  const dispatch = useAppDispatch();
  const { isOffline, showBackOnline, checking, lastError } =
    useAppSelector(selectConnectivity);

 

  const showOffline = isOffline;
  const showOnline = showBackOnline && !isOffline;

  // Offline modal should NOT close on backdrop press
  if (showOffline) {
    return (
      <Modal transparent visible animationType="fade">
        {/* Fullscreen blocker */}
        <View style={styles.backdropBlocker}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Dot color="#d32f2f" />
              <Text style={styles.title}>Sie sind offline</Text>
            </View>

            <Text style={styles.text}>
              Der Server ist aktuell nicht erreichbar. Bitte prüfen Sie die
              Verbindung und versuchen Sie es erneut.
            </Text>

            {!!lastError && <Text style={styles.subtle}>{lastError}</Text>}

            <Pressable
              style={[styles.button, checking && styles.buttonDisabled]}
              onPress={async () => {
                        const res = await dispatch(checkAlive()).unwrap();
                        if (res.isOnline) {
                            window.location.reload();
                        }
                        }}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Refresh</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Back-online modal: OK button OR click outside closes
  if (showOnline) {
    return (
      <Modal transparent visible animationType="fade">
        <Pressable
          style={styles.backdrop}
          onPress={() => dispatch(dismissBackOnline())}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.row}>
              <Dot color="#2e7d32" />
              <Text style={styles.title}>Sie sind wieder online</Text>
            </View>

            <Text style={styles.text}>
              Die Verbindung wurde wiederhergestellt.
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => dispatch(dismissBackOnline())}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  backdropBlocker: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  title: { fontSize: 18, fontWeight: "700" },
  text: { fontSize: 14, marginBottom: 10, lineHeight: 20 },
  subtle: { fontSize: 12, opacity: 0.7, marginBottom: 12 },
  button: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#111827",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "700" },
});