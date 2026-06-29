import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";

import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { ThemedText } from "../../components/themed/ThemedText";
import { H3 } from "../../components/stylistic/H3";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import { normalizeBaseUrl, selectApi } from "../../redux/slices/apiSlice";

import {
  resetUploadState,
  uploadAppSettingsFile,
} from "../../redux/slices/appSettingsFileUploadSlice";

const FILE_CONFIGURATION_PERFORMATIVE = "FILECONFIGURATION";
const FALLBACK_CONFIGURATION_TYPE = "JettyConfiguration";

function getFilenameFromContentDisposition(
  contentDisposition: string | null,
  fallbackName: string,
): string {
  if (!contentDisposition) return fallbackName;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    } catch {
      return utf8Match[1].replace(/"/g, "");
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return fallbackName;
}

function isRedirectStatus(status: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

export function AppSettingsFileUploadScreen() {
  const Feather = withUnistyles(Feather_);
  const { t } = useTranslation(["FileConfiguration"]);

  const dispatch = useAppDispatch();
  const api = useAppSelector(selectApi);
  const uploadState = useAppSelector((state) => state.appSettingsFileUpload);

  const fileInputRef = useRef<any>(null);

  const fallbackConfigurationTypeOptions = useMemo<Record<string, string>>(
    () => ({
      [FALLBACK_CONFIGURATION_TYPE]: t("configurationTypeJettyConfiguration"),
    }),
    [t],
  );

  const [performative, setPerformative] = useState(FALLBACK_CONFIGURATION_TYPE);

  const [configurationTypeOptions, setConfigurationTypeOptions] =
    useState<Record<string, string>>(fallbackConfigurationTypeOptions);

  const [configurationTypesLoading, setConfigurationTypesLoading] =
    useState(false);

  const [configurationTypesError, setConfigurationTypesError] =
    useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const canUpload = useMemo(() => {
    return Boolean(
      api.ip &&
        performative.trim() &&
        selectedFile &&
        !uploadState.loading,
    );
  }, [api.ip, performative, selectedFile, uploadState.loading]);

function getConfigurationTypeLabel(value: string): string {
  const normalized = value.trim();

  if (normalized === FALLBACK_CONFIGURATION_TYPE) {
    return t("configurationTypeJettyConfiguration");
  }

  if (normalized.toLowerCase().includes("awb")) {
    return t("configurationTypeAwbIni");
  }

  return normalized;
}
  useEffect(() => {
    let cancelled = false;

    async function loadConfigurationTypes() {
      if (!api.ip) return;

      setConfigurationTypesLoading(true);
      setConfigurationTypesError(null);

      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
          "X-Performative": FILE_CONFIGURATION_PERFORMATIVE,
        };

        if (api.authenticationMethod === "jwt" && api.jwt) {
          headers.Authorization = `Bearer ${api.jwt}`;
        }

        const response = await fetch(
          `${normalizeBaseUrl(api.ip)}/api/app/settings/get`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            redirect: "manual",
            headers,
          },
        );

        if (
          isRedirectStatus(response.status) ||
          (response as any).type === "opaqueredirect"
        ) {
          throw new Error(t("messageSessionInvalidOrLoginRequired"));
        }

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();

        const entries = Array.isArray(data?.propertyEntries)
          ? data.propertyEntries
          : [];

        const configurationTypes: string[] = entries
          .filter((entry: any) =>
            String(entry?.key ?? "")
              .toLowerCase()
              .startsWith("configurationtype"),
          )
          .flatMap((entry: any): string[] => {
            const value = String(entry?.value ?? "").trim();

            const valueOptions: string[] = Array.isArray(entry?.valueOptions)
              ? entry.valueOptions
                  .map((option: unknown) => String(option ?? "").trim())
                  .filter((option: string) => Boolean(option))
              : [];

            return [value, ...valueOptions].filter((item: string) =>
              Boolean(item),
            );
          });

        const uniqueTypes: string[] = Array.from(
          new Set<string>(configurationTypes),
        );

        if (uniqueTypes.length === 0) {
          throw new Error(t("messageNoConfigurationTypesFound"));
        }

        const options: Record<string, string> = Object.fromEntries(
          uniqueTypes.map((value): [string, string] => [
            value,
            getConfigurationTypeLabel(value),
          ]),
        );

        if (cancelled) return;

        setConfigurationTypeOptions(options);

        setPerformative((current: string): string => {
          if (current && options[current]) {
            return current;
          }

          return uniqueTypes[0] || FALLBACK_CONFIGURATION_TYPE;
        });

        console.log("[FILE CONFIG] configuration types:", uniqueTypes);
      } catch (error) {
        console.warn("[FILE CONFIG] could not load configuration types", error);

        if (!cancelled) {
          setConfigurationTypesError(
            t("messageConfigurationTypesCouldNotBeLoaded"),
          );

          setConfigurationTypeOptions(fallbackConfigurationTypeOptions);

          setPerformative((current: string): string => {
            return current || FALLBACK_CONFIGURATION_TYPE;
          });
        }
      } finally {
        if (!cancelled) {
          setConfigurationTypesLoading(false);
        }
      }
    }

    void loadConfigurationTypes();

    return () => {
      cancelled = true;
    };
  }, [
    api.ip,
    api.jwt,
    api.authenticationMethod,
    t,
    fallbackConfigurationTypeOptions,
  ]);

  function resetMessages() {
    setDownloadError(null);
    dispatch(resetUploadState());
  }

  function setFile(file: File | null) {
    setSelectedFile(file);
    resetMessages();
  }

  function openFileDialog() {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;

    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.style.display = "none";

      input.onchange = () => {
        const file = input.files?.[0] ?? null;
        setFile(file);
      };

      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  function handleDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragActive(false);

    const file = event.dataTransfer?.files?.[0] ?? null;

    if (file) {
      setFile(file);
    }
  }

  function handleDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();

    if (!isDragActive) {
      setIsDragActive(true);
    }
  }

  function handleDragLeave(event: any) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragActive(false);
  }

  async function uploadFile() {
    if (!selectedFile) return;

    setDownloadError(null);

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

  async function downloadCurrentConfiguration() {
    const selectedPerformative = performative.trim();

    if (!api.ip || !selectedPerformative) {
      setDownloadError(t("messageConfigurationPerformativeMissing"));
      return;
    }

    if (Platform.OS !== "web") {
      setDownloadError(t("messageDownloadOnlyAvailableForWeb"));
      return;
    }

    setDownloadLoading(true);
    setDownloadError(null);
    dispatch(resetUploadState());

    try {
      const headers: Record<string, string> = {
        Accept: "application/octet-stream",
        "X-Performative": selectedPerformative,
      };

      if (api.authenticationMethod === "jwt" && api.jwt) {
        headers.Authorization = `Bearer ${api.jwt}`;
      }

      const response = await fetch(
        `${normalizeBaseUrl(api.ip)}/api/app/settings/download`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          redirect: "manual",
          headers,
        },
      );

      if (
        isRedirectStatus(response.status) ||
        (response as any).type === "opaqueredirect"
      ) {
        throw new Error(t("messageSessionExpiredOrLoginRequired"));
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text ||
            t("messageDownloadFailedWithStatus", {
              status: response.status,
            }),
        );
      }

      if (contentType.toLowerCase().includes("application/json")) {
        const data = await response.json();

        throw new Error(
          data?.message || t("messageDownloadCouldNotBeExecuted"),
        );
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition");

      const fallbackFilename = `${selectedPerformative}.config`;

      const filename = getFilenameFromContentDisposition(
        contentDisposition,
        fallbackFilename,
      );

      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      console.warn("[FILE CONFIG] download failed", error);

      setDownloadError(
        error?.message || t("messageDownloadCouldNotBeExecuted"),
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  const dropZoneWebProps =
    Platform.OS === "web"
      ? {
          onDrop: handleDrop,
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
        }
      : {};

  return (
    <View style={s.container}>
      <Card>
        <View style={s.content}>
          <H3>{t("titleFileConfiguration")}</H3>

          <View style={s.field}>
            <ThemedText style={s.label}>
              {t("labelConfiguration")}
            </ThemedText>

            {configurationTypesLoading ? (
              <ThemedText style={s.mutedText}>
                {t("messageConfigurationTypesLoading")}
              </ThemedText>
            ) : (
              <Dropdown<string>
                value={performative}
                options={configurationTypeOptions}
                onChange={(value) => {
                  setPerformative(value);
                  resetMessages();
                }}
                size="sm"
              />
            )}

            {configurationTypesError ? (
              <ThemedText style={s.warning}>
                {configurationTypesError}
              </ThemedText>
            ) : null}
          </View>

          <View style={s.downloadRow}>
            <ThemedText style={s.normalText}>
              {t("labelDownloadCurrentConfiguration")}
            </ThemedText>

            <View style={s.buttonBox}>
              <ActionButton
                label={
                  downloadLoading
                    ? t("buttonDownloadLoading")
                    : t("buttonDownload")
                }
                variant="secondary"
                size="sm"
                onPress={downloadCurrentConfiguration}
                disabled={downloadLoading || !performative.trim()}
              />
            </View>
          </View>

          {downloadError ? (
            <ThemedText style={s.error}>{downloadError}</ThemedText>
          ) : null}

          <View style={s.field}>
            <ThemedText style={s.normalText}>
              {t("labelUploadNewFile")}
            </ThemedText>

            <Pressable
              onPress={openFileDialog}
              style={[
                s.dropZone,
                isDragActive && s.dropZoneActive,
                selectedFile && s.dropZoneSelected,
              ]}
              {...(dropZoneWebProps as any)}
            >
              <View style={s.dropZoneCenter}>
                <Feather
                  name="upload-cloud"
                  size={42}
                  color={s.iconColor.color}
                />

                <ThemedText style={s.dropZoneText}>
                  {isDragActive
                    ? t("dropZoneDropFileHere")
                    : t("dropZoneDragAndDropFileHere")}
                </ThemedText>

                <ThemedText style={s.dropZoneSubText}>
                  {t("dropZoneClickToSelectFile")}
                </ThemedText>
              </View>
            </Pressable>

            <View style={s.fileFooter}>
              <View style={s.fileNameBox}>
                <ThemedText style={s.fileNameLabel}>
                  {t("labelFileName")}
                </ThemedText>

                <ThemedText style={s.fileName} numberOfLines={1}>
                  {selectedFile?.name || t("messageNoFileSelected")}
                </ThemedText>
              </View>

              <View style={s.buttonBox}>
                <ActionButton
                  label={
                    uploadState.loading
                      ? t("buttonUploadLoading")
                      : t("buttonUpload")
                  }
                  variant="primary"
                  size="sm"
                  onPress={uploadFile}
                  disabled={!canUpload}
                />
              </View>
            </View>
          </View>

          {uploadState.error ? (
            <ThemedText style={s.error}>{uploadState.error}</ThemedText>
          ) : null}

          {uploadState.result ? (
            <ThemedText
              style={[
                s.message,
                uploadState.result.messageType === "WARNING"
                  ? s.warning
                  : s.success,
              ]}
            >
              {uploadState.result.message || t("messageUploadSuccessful")}
            </ThemedText>
          ) : null}
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create((theme) => ({
  container: {
    padding: 24,
    maxWidth: 980,
  },

  content: {
    gap: 18,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
  },

  normalText: {
    fontSize: 15,
  },

  mutedText: {
    fontSize: 13,
    opacity: 0.7,
  },

  downloadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  buttonBox: {
    width: 112,
  },

  dropZone: {
    minHeight: 190,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(140,140,140,0.45)",
    backgroundColor: "rgba(140,140,140,0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  dropZoneCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  dropZoneActive: {
    borderColor: "rgba(120,220,140,0.9)",
    backgroundColor: "rgba(120,220,140,0.14)",
  },

  dropZoneSelected: {
    borderColor: "rgba(140,140,140,0.75)",
  },

  iconColor: {
    color: theme.colors.text,
  },

  dropZoneText: {
    fontSize: 24,
    opacity: 0.72,
    textAlign: "center",
  },

  dropZoneSubText: {
    fontSize: 13,
    opacity: 0.55,
    textAlign: "center",
  },

  fileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  fileNameBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 240,
  },

  fileNameLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  fileName: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },

  error: {
    color: "#ff7676",
    fontSize: 13,
  },

  message: {
    fontSize: 13,
  },

  success: {
    color: "#70d87b",
    fontSize: 13,
  },

  warning: {
    color: "#f5c542",
    fontSize: 13,
  },
}));