import React, { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";
import { H3 } from "../../components/stylistic/H3";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";
import {
  resetUploadState,
  uploadAppSettingsFile,
} from "../../redux/slices/appSettingsFileUploadSlice";

export function AppSettingsFileUploadScreen() {
  const dispatch = useAppDispatch();
  const api = useAppSelector(selectApi);
  const uploadState = useAppSelector((state) => state.appSettingsFileUpload);

  const [performative, setPerformative] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const canUpload = useMemo(() => {
    return Boolean(api.ip && performative.trim() && selectedFile && !uploadState.loading);
  }, [api.ip, performative, selectedFile, uploadState.loading]);

  function pickFile() {
    if (typeof document === "undefined") return;

    const input = document.createElement("input");
    input.type = "file";

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      setSelectedFile(file);
      dispatch(resetUploadState());
    };

    input.click();
  }

  async function uploadFile() {
    if (!selectedFile) return;

    await dispatch(
      uploadAppSettingsFile({
        baseUrl: api.ip,
        jwt: api.jwt,
        authenticationMethod: api.authenticationMethod,
        performative: performative.trim(),
        file: {
          name: selectedFile.name,
          type: selectedFile.type,
          file: selectedFile,
        },
      }),
    );
  }

  return (
    <View style={s.container}>
      <Card>
        <View style={s.content}>
          <H3>Settings File Upload</H3>

          <ThemedText style={s.description}>
            Upload einer App-Settings-Datei mit Performative.
          </ThemedText>

          <View style={s.field}>
            <ThemedText style={s.label}>Performative</ThemedText>

            <TextInput
              value={performative}
              onChangeText={(value) => {
                setPerformative(value);
                dispatch(resetUploadState());
              }}
              placeholder="z. B. UPDATE_STRATEGY"
              placeholderTextColor="#777"
              style={s.input}
              autoCapitalize="characters"
            />
          </View>

          <View style={s.field}>
            <ThemedText style={s.label}>Datei</ThemedText>

            <View style={s.fileRow}>
              <ActionButton
                label="Datei auswählen"
                variant="secondary"
                size="sm"
                onPress={pickFile}
                disabled={uploadState.loading}
              />

              <ThemedText style={s.fileName}>
                {selectedFile?.name || "Keine Datei ausgewählt"}
              </ThemedText>
            </View>
          </View>

          {uploadState.error ? (
            <ThemedText style={s.error}>{uploadState.error}</ThemedText>
          ) : null}

          {uploadState.result ? (
            <ThemedText style={s.success}>
              {uploadState.result.message || "Upload erfolgreich."}
            </ThemedText>
          ) : null}

          <View style={s.actions}>
            <ActionButton
              label={uploadState.loading ? "Upload läuft..." : "Upload starten"}
              variant="primary"
              size="sm"
              onPress={uploadFile}
              disabled={!canUpload}
            />
          </View>
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 24,
    maxWidth: 900,
  },

  content: {
    gap: 14,
  },

  description: {
    fontSize: 13,
    opacity: 0.75,
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    color: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  fileName: {
    fontSize: 13,
    opacity: 0.8,
  },

  error: {
    color: "#ff7676",
    fontSize: 13,
  },

  success: {
    color: "#70d87b",
    fontSize: 13,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 4,
  },
});