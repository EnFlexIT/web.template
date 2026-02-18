// src/screens/AppInfoScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { Infobox } from "../components/ui-elements/Infobox";
import { TableSwitchCell } from "../components/ui-elements/TableSwitchCell";
import { ThemedText } from "../components/themed/ThemedText";

import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";

const AUTO_KEY = "appInfo_autoUpdateEnabled";
const LAST_ACCEPTED_KEY = "appInfo_lastAcceptedServerVersion";

const API_PREFIX = "/api";
const DC_PREFIX = "/dc";

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}
function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
function fmtRelease(v: any) {
  const major = v?.major ?? 0;
  const minor = v?.minor ?? 0;
  const micro = v?.micro ?? 0;
  return `${major}.${minor}.${micro}`;
}
function fmtFull(v: any) {
  const r = fmtRelease(v);
  const q = (v?.qualifier ?? "").trim();
  return q ? `${r}-${q}` : r;
}

type BundleInformation = {
  FeatureName?: string;
  Provider?: string;
  BundleName?: string;
  BundleID?: number;
  Version?: any;
};

async function fetchJsonNoCache(params: { url: string; jwt: string | null }) {
  try {
    const res = await fetch(params.url, {
      method: "GET",
      cache: "no-store" as any,
      headers: params.jwt ? { Authorization: `Bearer ${params.jwt}` } : undefined,
    });
    if (!res.ok) return { __status: res.status };
    return await res.json();
  } catch {
    return null;
  }
}

export function AppInfoScreen() {
  const { t } = useTranslation(["Settings.AppInfo"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [autoEnabled, setAutoEnabled] = useState(true);
  const [serverRelease, setServerRelease] = useState<string>("-");
  const [serverFull, setServerFull] = useState<string>("-");
  const [lastAccepted, setLastAccepted] = useState<string>("-");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [bundles, setBundles] = useState<BundleInformation[] | null>(null);
  const [bundlesHint, setBundlesHint] = useState<string | null>(null);

  const webAppVersion = process.env.EXPO_PUBLIC_WEBAPP_VERSION ?? "-";
  const webAppBuildDate = process.env.EXPO_PUBLIC_WEBAPP_BUILD_DATE ?? "-";

  const loadPrefs = useCallback(async () => {
    const autoRaw = await AsyncStorage.getItem(AUTO_KEY);
    const acceptedRaw = await AsyncStorage.getItem(LAST_ACCEPTED_KEY);

    setAutoEnabled(autoRaw === null ? true : autoRaw === "1");
    if (acceptedRaw) setLastAccepted(acceptedRaw);
  }, []);

  const checkNow = useCallback(async () => {
    if (!ip) return;

    setIsChecking(true);

    const versionUrl = joinUrl(ip, `${API_PREFIX}/version?t=${Date.now()}`);
    const vData = await fetchJsonNoCache({ url: versionUrl, jwt });

    setLastCheckedAt(new Date().toLocaleString());

    if (vData && !vData.__status) {
      const release = fmtRelease(vData);
      const full = fmtFull(vData);

      setServerRelease(release);
      setServerFull(full);

      const acceptedStored = (await AsyncStorage.getItem(LAST_ACCEPTED_KEY)) ?? null;
      if (!acceptedStored) {
        await AsyncStorage.setItem(LAST_ACCEPTED_KEY, release);
        setLastAccepted(release);
        setUpdateAvailable(false);
      } else {
        setLastAccepted(acceptedStored);
        setUpdateAvailable(acceptedStored !== release);
      }
    }

    const detailsUrl = joinUrl(ip, `${DC_PREFIX}/installationDetails?t=${Date.now()}`);
    const dData = await fetchJsonNoCache({ url: detailsUrl, jwt });

    if (dData === null) {
      setBundles(null);
      setBundlesHint(t("bundles.error_network", "Bundles: Netzwerkfehler."));
    } else if (dData?.__status === 401) {
      setBundles(null);
      setBundlesHint(
        t("bundles.error_401", "Bundles: 401 (Unauthorized) – Endpoint braucht gültiges JWT/Rechte."),
      );
    } else if (dData?.__status === 404) {
      setBundles(null);
      setBundlesHint(
        t("bundles.error_404", "Bundles: 404 (Not Found) – Endpoint existiert nicht unter diesem Pfad."),
      );
    } else if (Array.isArray(dData)) {
      setBundles(dData);
      setBundlesHint(null);
    } else {
      setBundles(null);
      setBundlesHint(t("bundles.error_format", "Bundles: Unerwartetes Format vom Server."));
    }

    setIsChecking(false);
  }, [ip, jwt, t]);

  const onToggleAuto = useCallback(async (next: boolean) => {
    setAutoEnabled(next);
    await AsyncStorage.setItem(AUTO_KEY, next ? "1" : "0");
  }, []);

  const onReload = useCallback(async () => {
    if (serverRelease && serverRelease !== "-") {
      await AsyncStorage.setItem(LAST_ACCEPTED_KEY, serverRelease);
      setLastAccepted(serverRelease);
      setUpdateAvailable(false);
    }
    if (Platform.OS === "web") window.location.reload();
  }, [serverRelease]);

  useEffect(() => {
    loadPrefs().then(() => checkNow());
  }, [loadPrefs, checkNow]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (autoEnabled) {
      intervalRef.current = setInterval(() => {
        checkNow();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoEnabled, checkNow]);

  const box = (() => {
    if (!ip) {
      return {
        tone: "warning" as const,
        title: t("infobox.no_server.title", "Kein Server verbunden"),
        subtitle: t("infobox.no_server.subtitle", "Bitte zuerst eine Server-IP konfigurieren."),
      };
    }
    if (updateAvailable) {
      return {
        tone: "warning" as const,
        title: t("infobox.update.title", "Update verfügbar"),
        subtitle: t("infobox.update.subtitle", "Neue Server-Version erkannt. Tippen Sie auf „Neu laden“."),
      };
    }
    return {
      tone: "info" as const,
      title: t("infobox.ok.title", "Alles aktuell"),
      subtitle: t("infobox.ok.subtitle", "Sie verwenden den letzten akzeptierten Stand."),
    };
  })();

  return (
    <Screen>
      <Card >
      
          <View>
            <ThemedText style={s.title}>{t("title", "App-Info")}</ThemedText>
            <ThemedText style={s.sub}>{t("subtitle", "Versionsdetails und Update-Einstellungen.")}</ThemedText>

            <View style={s.block}>
              <ThemedText style={s.blockTitle}>{t("web.title", "Web-App (BaseTemplate)")}</ThemedText>
              <Row label={t("web.version", "Web-App Version")} value={webAppVersion} />
              <Row label={t("web.buildDate", "Build-Datum")} value={webAppBuildDate} />
            </View>

            <View style={s.block}>
              <ThemedText style={s.blockTitle}>{t("server.title", "Server")}</ThemedText>
              <Row label={t("serverRelease", "Server-Version (Release)")} value={serverRelease} />
              <Row label={t("serverFull", "Server-Version (Full)")} value={serverFull} />
              <Row label={t("lastAccepted", "Letzter akzeptierter Stand")} value={lastAccepted} />
              <Row label={t("lastChecked", "Zuletzt geprüft")} value={lastCheckedAt} />
            </View>

            <View style={[s.block, s.toggleRow]}>
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText style={s.blockTitle}>{t("auto.title", "Automatisch prüfen")}</ThemedText>
                <ThemedText style={s.sub}>
                  {t("auto.subtitle", "Standardmäßig aktiv. Kann vom Nutzer deaktiviert werden.")}
                </ThemedText>
              </View>
              <View style={s.rightCell}>
                <TableSwitchCell value={autoEnabled} onChange={onToggleAuto} />
              </View>
            </View>

            <View style={s.btnRow}>
              <ActionButton
                label={isChecking ? t("checkNow_loading", "Prüfe…") : t("checkNow", "Jetzt prüfen")}
                variant="secondary"
                size="xs"
                onPress={checkNow}
                disabled={isChecking || !ip}
              />
              <ActionButton
                label={t("reload", "Neu laden")}
                variant="secondary"
                size="xs"
                onPress={onReload}
                disabled={!updateAvailable}
              />
            </View>
            <View style={s.bottom}>
              <Infobox tone={box.tone} title={box.title} subtitle={box.subtitle} style={s.fixedBox} />
            </View>
          </View>
       
      </Card>
    </Screen>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <View style={s.rowLine}>
      <ThemedText style={s.label}>{props.label}</ThemedText>
      <ThemedText style={s.value}>{props.value || "-"}</ThemedText>
    </View>
  );
}

const s = StyleSheet.create({

  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  sub: {
    fontSize: 12,
    opacity: 0.7,
  },
  block: {
    padding: 14,
    gap: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 12,
    opacity: 0.75,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightCell: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  bottom: {
    paddingTop: 8,
  },
  fixedBox: {
    minHeight: 140,
  },
  bundleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  bundleName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

});
