import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";

import { useFileDropWeb } from "../../hooks/useFileDropWeb";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { ThemedText } from "../../components/themed/ThemedText";
import { H3 } from "../../components/stylistic/H3";
import { BackendUpdateProgressDialog } from "../../screens/update/Dialog/BackendUpdateProgressDialog";
import { ConfirmDialog } from "../../components/ui-elements/ConfirmDialog";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  logoutAsync,
  normalizeBaseUrl,
  selectApi,
  setIpAsync,
} from "../../redux/slices/apiSlice";

import {
  selectServer as selectServerAction,
  selectServers,
  updateServer,
} from "../../redux/slices/serverSlice";

import {
  resetUploadState,
  uploadAppSettingsFile,
} from "../../redux/slices/appSettingsFileUploadSlice";

const Feather = withUnistyles(Feather_);

const FILE_CONFIGURATION_PERFORMATIVE = "FILECONFIGURATION";
const FALLBACK_CONFIGURATION_TYPE = "JettyConfiguration";

type ConfigDialogPhase =
  | "installing"
  | "restarting"
  | "reconnecting"
  | "logout";

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

function getDirectChildText(element: Element, childName: string): string | null {
  const child = Array.from(element.children).find(
    (item) => item.localName === childName,
  );

  return child?.textContent?.trim() || null;
}

function getJettySetting(xml: Document, settingKey: string): string | null {
  const entries = Array.from(xml.getElementsByTagName("entry"));

  for (const entry of entries) {
    const key = getDirectChildText(entry, "key");

    if (key !== settingKey) continue;

    const valueWrapper = Array.from(entry.children).find(
      (child) => child.localName === "value",
    );

    if (!valueWrapper) return null;

    const valueNodes = Array.from(valueWrapper.getElementsByTagName("value"));
    const leafValue = valueNodes[valueNodes.length - 1];

    return leafValue?.textContent?.trim() || valueWrapper.textContent?.trim() || null;
  }

  return null;
}

function setJettySetting(
  xml: Document,
  settingKey: string,
  nextValue: string,
): boolean {
  const entries = Array.from(xml.getElementsByTagName("entry"));

  for (const entry of entries) {
    const key = getDirectChildText(entry, "key");

    if (key !== settingKey) continue;

    const valueWrapper = Array.from(entry.children).find(
      (child) => child.localName === "value",
    );

    if (!valueWrapper) return false;

    const valueNodes = Array.from(valueWrapper.getElementsByTagName("value"));
    const leafValue = valueNodes[valueNodes.length - 1];

    if (!leafValue) return false;

    leafValue.textContent = nextValue;
    return true;
  }

  return false;
}

function getDisplayFilePath(file: File, inputValue?: string | null): string {
  const fileWithExtraFields = file as File & {
    path?: string;
    webkitRelativePath?: string;
  };

  return (
    fileWithExtraFields.path ||
    fileWithExtraFields.webkitRelativePath ||
    inputValue ||
    file.name
  );
}

function shouldHandleAsJettyConfiguration(params: {
  file: File;
  performative: string;
}): boolean {
  const fileName = params.file.name.toLowerCase();

  return (
    params.performative === FALLBACK_CONFIGURATION_TYPE ||
    fileName.endsWith(".xml")
  );
}

async function readNextBaseUrlFromJettyConfiguration(params: {
  file: File;
  currentBaseUrl: string;
  performative: string;
}): Promise<string | null> {
  if (Platform.OS !== "web") return null;
  if (typeof DOMParser === "undefined") return null;
  if (!shouldHandleAsJettyConfiguration(params)) return null;

  try {
    const text = await params.file.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const parserError = xml.getElementsByTagName("parsererror")[0];

    if (parserError) return null;

    const httpEnabled =
      getJettySetting(xml, "http.enabled")?.toLowerCase() === "true";
    const httpsEnabled =
      getJettySetting(xml, "https.enabled")?.toLowerCase() === "true";

    const httpPort = getJettySetting(xml, "http.port");
    const httpsPort = getJettySetting(xml, "https.port");

    const currentUrl = new URL(params.currentBaseUrl);
    const protocol = httpsEnabled ? "https:" : "http:";
    const port = httpsEnabled ? httpsPort : httpEnabled ? httpPort : null;

    if (!port) return null;

    const nextBaseUrl = `${protocol}//${currentUrl.hostname}:${port}`;
    const currentBaseUrl = normalizeBaseUrl(params.currentBaseUrl);

    if (normalizeBaseUrl(nextBaseUrl) === currentBaseUrl) {
      return null;
    }

    return nextBaseUrl;
  } catch (error) {
    console.warn("[FILE CONFIG] could not detect next server port", error);
    return null;
  }
}

async function rewriteJettyConfigurationToCurrentBaseUrl(params: {
  file: File;
  currentBaseUrl: string;
  performative: string;
}): Promise<File> {
  if (Platform.OS !== "web") return params.file;
  if (typeof DOMParser === "undefined") return params.file;
  if (typeof XMLSerializer === "undefined") return params.file;
  if (!shouldHandleAsJettyConfiguration(params)) return params.file;

  try {
    const currentUrl = new URL(normalizeBaseUrl(params.currentBaseUrl));
    const currentPort =
      currentUrl.port || (currentUrl.protocol === "https:" ? "443" : "80");

    const text = await params.file.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const parserError = xml.getElementsByTagName("parsererror")[0];

    if (parserError) return params.file;

    if (currentUrl.protocol === "https:") {
      setJettySetting(xml, "https.enabled", "true");
      setJettySetting(xml, "https.port", currentPort);
    } else {
      setJettySetting(xml, "http.enabled", "true");
      setJettySetting(xml, "http.port", currentPort);
      setJettySetting(xml, "http.to.https", "false");
    }

    const serializedXml = new XMLSerializer().serializeToString(xml);

    return new File([serializedXml], params.file.name, {
      type: params.file.type || "application/xml",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("[FILE CONFIG] could not rewrite server port", error);
    return params.file;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AppSettingsFileUploadScreen() {
  const { t } = useTranslation(["FileConfiguration"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);
  const uploadState = useAppSelector((state) => state.appSettingsFileUpload);
  const serversState = useAppSelector(selectServers);

  const servers = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((server) => server.id === selectedServerId);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [portDialogVisible, setPortDialogVisible] = useState(false);

  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [configDialogPhase, setConfigDialogPhase] =
    useState<ConfigDialogPhase>("installing");
  const [configDialogText, setConfigDialogText] = useState<string | undefined>();

  const fallbackConfigurationTypeOptions = useMemo<Record<string, string>>(
    () => ({
      [FALLBACK_CONFIGURATION_TYPE]: FALLBACK_CONFIGURATION_TYPE,
    }),
    [],
  );

  const [performative, setPerformative] = useState(FALLBACK_CONFIGURATION_TYPE);
  const [configurationTypeOptions, setConfigurationTypeOptions] =
    useState<Record<string, string>>(fallbackConfigurationTypeOptions);

  const [configurationTypesLoading, setConfigurationTypesLoading] =
    useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const [nextBaseUrlAfterUpload, setNextBaseUrlAfterUpload] =
    useState<string | null>(null);

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

  const getConfigurationTypeLabel = useCallback((value: string): string => {
    return value.trim();
  }, []);

  function resetMessages() {
    setDownloadError(null);
    dispatch(resetUploadState());
  }

  function setFile(file: File | null, inputValue?: string | null) {
    setSelectedFile(file);
    setSelectedFilePath(file ? getDisplayFilePath(file, inputValue) : null);
    resetMessages();
  }

  function syncSelectedServerBaseUrl(baseUrl: string) {
    if (!selectedServer || selectedServer.id === "local") return;

    dispatch(
      updateServer({
        id: selectedServer.id,
        name: selectedServer.name,
        baseUrl,
      }),
    );

    dispatch(selectServerAction(selectedServer.id));
  }

  const { dropRef, dragging } = useFileDropWeb({
    enabled: Platform.OS === "web",
    onFiles: (files) => {
      const file = files[0] ?? null;
      setFile(file);
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function detectNextBaseUrl() {
      setNextBaseUrlAfterUpload(null);

      if (!selectedFile || !api.ip) return;

      const currentBaseUrl = normalizeBaseUrl(api.ip);

      const nextBaseUrl = await readNextBaseUrlFromJettyConfiguration({
        file: selectedFile,
        currentBaseUrl,
        performative,
      });

      if (!cancelled) {
        setNextBaseUrlAfterUpload(nextBaseUrl);
      }
    }

    void detectNextBaseUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedFile, api.ip, performative]);

  useEffect(() => {
    let cancelled = false;

    async function loadConfigurationTypes() {
      if (!api.ip) return;

      setConfigurationTypesLoading(true);

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
                  .filter(Boolean)
              : [];

            return [value, ...valueOptions].filter(Boolean);
          });

        const uniqueTypes = Array.from(new Set(configurationTypes));

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

        setPerformative((current) => {
          if (current && options[current]) {
            return current;
          }

          return uniqueTypes[0] || FALLBACK_CONFIGURATION_TYPE;
        });
      } catch (error) {
        console.warn("[FILE CONFIG] could not load configuration types", error);

        if (!cancelled) {
          setConfigurationTypeOptions(fallbackConfigurationTypeOptions);
          setPerformative((current) => current || FALLBACK_CONFIGURATION_TYPE);
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
    getConfigurationTypeLabel,
  ]);

  function openFileDialog() {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;

    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.style.display = "none";

      input.onchange = () => {
        const file = input.files?.[0] ?? null;
        setFile(file, input.value);
      };

      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function uploadFile() {
    if (!selectedFile) return;

    if (nextBaseUrlAfterUpload) {
      setPortDialogVisible(true);
      return;
    }

    await uploadFileConfirmed(false);
  }

  async function uploadFileConfirmed(shouldSwitchToDetectedUrl: boolean) {
    if (!selectedFile) return;

    const currentBaseUrlBeforeUpload = normalizeBaseUrl(api.ip);

    setPortDialogVisible(false);
    setDownloadError(null);
    dispatch(resetUploadState());

    setConfigDialogVisible(true);
    setConfigDialogPhase("installing");
    setConfigDialogText(
      t(
        "messageConfigurationUploadInstalling",
        "Konfiguration wird hochgeladen und angewendet...",
      ),
    );

    try {
      const fileToUpload =
        shouldSwitchToDetectedUrl || !nextBaseUrlAfterUpload
          ? selectedFile
          : await rewriteJettyConfigurationToCurrentBaseUrl({
              file: selectedFile,
              currentBaseUrl: currentBaseUrlBeforeUpload,
              performative: performative.trim(),
            });

      const targetBaseUrl =
        shouldSwitchToDetectedUrl && nextBaseUrlAfterUpload
          ? normalizeBaseUrl(nextBaseUrlAfterUpload)
          : currentBaseUrlBeforeUpload;

      const result = await dispatch(
        uploadAppSettingsFile({
          baseUrl: api.ip,
          jwt: api.jwt,
          authenticationMethod: api.authenticationMethod,
          performative: performative.trim(),
          file: {
            name: fileToUpload.name,
            type: fileToUpload.type,
            file: fileToUpload,
          },
        }),
      ).unwrap();

      setConfigDialogPhase("restarting");
      setConfigDialogText(
        shouldSwitchToDetectedUrl && nextBaseUrlAfterUpload
          ? t(
              "messageConfigurationUploadSuccessWithNewPort",
              "Die Konfiguration wurde erfolgreich angewendet. Der Server startet voraussichtlich unter {{url}} neu.",
              { url: nextBaseUrlAfterUpload },
            )
          : result?.message ||
              t(
                "messageConfigurationUploadSuccessKeepCurrentPort",
                "Die Konfiguration wurde erfolgreich angewendet. Die aktuelle Server-Adresse wird beibehalten.",
              ),
      );

      await wait(1400);

      setConfigDialogPhase("logout");
      setConfigDialogText(
        t(
          "messageConfigurationUploadLogout",
          "Die Anmeldung wird zurückgesetzt. Bitte melde dich danach erneut an.",
        ),
      );

      await wait(900);

      syncSelectedServerBaseUrl(targetBaseUrl);
      await dispatch(setIpAsync(targetBaseUrl));
      await dispatch(logoutAsync());

      syncSelectedServerBaseUrl(targetBaseUrl);
      await dispatch(setIpAsync(targetBaseUrl));

      setConfigDialogVisible(false);
    } catch (error: any) {
      setConfigDialogVisible(false);

      setDownloadError(
        error?.message ||
          String(error ?? "") ||
          t(
            "messageConfigurationUploadFailed",
            "Konfiguration konnte nicht hochgeladen werden.",
          ),
      );
    }
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

            <View ref={dropRef as any}>
              <Pressable
                onPress={openFileDialog}
                style={[
                  s.dropZone,
                  dragging && s.dropZoneActive,
                  selectedFile && s.dropZoneSelected,
                ]}
              >
                <View style={s.dropZoneCenter}>
                  <Feather
                    name="upload-cloud"
                    size={42}
                    color={s.iconColor.color}
                  />

                  <ThemedText style={s.dropZoneText}>
                    {dragging
                      ? t("dropZoneDropFileHere")
                      : t("dropZoneDragAndDropFileHere")}
                  </ThemedText>

                  <ThemedText style={s.dropZoneSubText}>
                    {t("dropZoneClickToSelectFile")}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {nextBaseUrlAfterUpload ? (
              <ThemedText style={s.info}>
                {t(
                  "messageDetectedNextServerUrl",
                  "Die Datei ändert voraussichtlich die Server-Adresse auf {{url}}.",
                  { url: nextBaseUrlAfterUpload },
                )}
              </ThemedText>
            ) : null}

            <View style={s.fileFooter}>
              <View style={s.fileNameBox}>
                <ThemedText style={s.fileNameLabel}>
                  {t("labelFilePath", "Dateipfad:")}
                </ThemedText>

                <ThemedText style={s.fileName} numberOfLines={1}>
                  {selectedFilePath || t("messageNoFileSelected")}
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

        <BackendUpdateProgressDialog
          visible={configDialogVisible}
          phase={configDialogPhase}
          statusText={configDialogText}
        />

        <ConfirmDialog
          visible={portDialogVisible}
          variant="warning"
          icon="alert-triangle"
          title={t(
            "messagePortChangeDialogTitle",
            "Server-Adresse ändern?",
          )}
          description={t(
            "messagePortChangeDialogDescription",
            "Die ausgewählte Konfiguration ändert die Server-Adresse von {{currentUrl}} auf {{nextUrl}}. Möchtest du die neue Adresse verwenden oder die Datei vor dem Upload auf die aktuelle Adresse umschreiben?",
            {
              currentUrl: normalizeBaseUrl(api.ip),
              nextUrl: nextBaseUrlAfterUpload,
            },
          )}
          cancelLabel={t(
            "buttonKeepCurrentServer",
            "Aktuelle Adresse behalten",
          )}
          confirmLabel={t(
            "buttonSwitchToDetectedServer",
            "Neue Adresse verwenden",
          )}
          onCancel={() => {
            void uploadFileConfirmed(false);
          }}
          onConfirm={() => {
            void uploadFileConfirmed(true);
          }}
          onClose={() => {
            setPortDialogVisible(false);
          }}
        />
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
    width: 150,
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

  info: {
    color: "#2f80ed",
    fontSize: 13,
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