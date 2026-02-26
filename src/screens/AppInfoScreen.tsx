// src/screens/AppInfoScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { Infobox } from "../components/ui-elements/Infobox";
import { ThemedText } from "../components/themed/ThemedText";

import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";

const LAST_ACCEPTED_KEY = "appInfo_lastAcceptedServerWebAppVersionFull";
const API_PREFIX = "/api";

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}
function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string; // build / timestamp etc.
};

function fmtRelease(v: ApiVersion | null | undefined) {
  const major = v?.major ?? 0;
  const minor = v?.minor ?? 0;
  const micro = v?.micro ?? 0;
  return `${major}.${minor}.${micro}`;
}
function fmtFull(v: ApiVersion | null | undefined) {
  const r = fmtRelease(v);
  const q = String(v?.qualifier ?? "").trim();
  return q ? `${r}-${q}` : r;
}

/**
 * Expected server payload contains SoftwareComponentList (or softwareComponentList)
 * We prefer componentType "WEBAPP". Fallback to first.
 */
function extractServerWebApp(data: any): {
  bundleName: string;
  version: ApiVersion;
  id?: string;
} | null {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list) || list.length === 0) return null;

  const item =
    list.find((x: any) => String(x?.componentType ?? "").toUpperCase() === "WEBAPP") ??
    list[0];

  const version = item?.version ?? item?.Version;
  if (!version || typeof version !== "object") return null;

  return {
    bundleName: String(item?.name ?? item?.Name ?? "-"),
    version: {
      major: Number(version?.major ?? version?.Major ?? 0),
      minor: Number(version?.minor ?? version?.Minor ?? 0),
      micro: Number(version?.micro ?? version?.Micro ?? 0),
      qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
    },
    id: String(item?.ID ?? item?.id ?? ""),
  };
}

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
    return null; // network error
  }
}

/**
 * Hard reload for Web, with cache-buster query params to avoid stale index.html/assets.
 * Uses replace() to prevent going "back" to the old version.
 */
function hardReloadWeb(cacheKey: string) {
  if (typeof window === "undefined") return;

  const u = new URL(window.location.href);
  u.searchParams.set("_v", cacheKey); // version-based buster
  u.searchParams.set("_ts", String(Date.now())); // extra safety
  window.location.replace(u.toString());
}

export function AppInfoScreen() {
  const { t } = useTranslation(["Settings.AppInfo"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [serverBundle, setServerBundle] = useState<string>("-");
  const [serverRelease, setServerRelease] = useState<string>("-");
  const [serverFull, setServerFull] = useState<string>("-");
  const [lastAccepted, setLastAccepted] = useState<string>("-");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [updateStatus, setUpdateStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const checkNow = useCallback(async () => {
    if (!ip) return;

    setIsChecking(true);
    setLastCheckedAt(new Date().toLocaleString());

    const query = new URLSearchParams();
    query.set("_ts", String(Date.now())); // cache-buster for the API call

    const url = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);
    const data = await fetchJsonNoCache({ url, jwt });

    // Network error
    if (data === null) {
      setUpdateStatus("Network error");
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setIsChecking(false);
      return;
    }

    // HTTP error
    if ((data as any)?.__status) {
      const st = Number((data as any).__status);
      setUpdateStatus(st === 401 ? "401 (Unauthorized)" : `HTTP ${st}`);
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setIsChecking(false);
      return;
    }

    const parsed = extractServerWebApp(data);
    if (!parsed) {
      setUpdateStatus("Unexpected format");
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setIsChecking(false);
      return;
    }

    const release = fmtRelease(parsed.version);
    const full = fmtFull(parsed.version); // IMPORTANT: compare FULL (includes qualifier/build)

    setServerBundle(parsed.bundleName || "-");
    setServerRelease(release);
    setServerFull(full);

    // read stored baseline/accepted
    const acceptedStored = (await AsyncStorage.getItem(LAST_ACCEPTED_KEY)) ?? null;

    if (!acceptedStored) {
      // first run -> store baseline; do NOT reload
      await AsyncStorage.setItem(LAST_ACCEPTED_KEY, full);
      setLastAccepted(full);
      setUpdateStatus("OK (baseline stored)");
      setIsChecking(false);
      return;
    }

    setLastAccepted(acceptedStored);

    // compare FULL, because server uses build timestamp (qualifier)
    if (acceptedStored !== full) {
      setUpdateStatus(`Update detected: ${acceptedStored} → ${full}`);

      // store new accepted first to avoid reload loops
      await AsyncStorage.setItem(LAST_ACCEPTED_KEY, full);

      // Web: hard reload whole page
      if (Platform.OS === "web" && typeof window !== "undefined") {
        hardReloadWeb(full);
        return; // stop here
      }

      // Native: (optional) you could show a message, or trigger some navigation reset
      setIsChecking(false);
      return;
    }

    setUpdateStatus("Up to date");
    setIsChecking(false);
  }, [ip, jwt]);

  // On mount: load lastAccepted and check once
  useEffect(() => {
    (async () => {
      const acceptedRaw = await AsyncStorage.getItem(LAST_ACCEPTED_KEY);
      if (acceptedRaw) setLastAccepted(acceptedRaw);
      await checkNow();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regular check
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      checkNow();
    }, 5 * 60 * 1000); // every 5 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkNow]);

  const box = (() => {
    if (!ip) {
      return {
        tone: "warning" as const,
        title: t("infobox.no_server.title", "Kein Server verbunden"),
        subtitle: t(
          "infobox.no_server.subtitle",
          "Bitte zuerst eine Server-IP konfigurieren.",
        ),
      };
    }

    if (String(updateStatus).toLowerCase().includes("update detected")) {
      return {
        tone: "warning" as const,
        title: "Update detected",
        subtitle: "A new Web-App version was detected. Reload is triggered automatically.",
      };
    }

    if (String(updateStatus).toLowerCase().includes("unauthorized")) {
      return {
        tone: "warning" as const,
        title: "Version check not authorized",
        subtitle: "Server returned 401. Check JWT / permissions for /api/version.",
      };
    }

    if (String(updateStatus).toLowerCase().includes("network")) {
      return {
        tone: "warning" as const,
        title: "Network issue",
        subtitle: "Server version could not be checked due to a network error.",
      };
    }

    if (String(updateStatus).toLowerCase().includes("http")) {
      return {
        tone: "warning" as const,
        title: "HTTP issue",
        subtitle: `Server returned: ${updateStatus}`,
      };
    }

    return {
      tone: "info" as const,
      title: "OK",
      subtitle: "Server Web-App version is up to date.",
    };
  })();

  return (
    <Screen>
      <Card>
        <View>
          <ThemedText style={s.title}>{t("title", "App-Info")}</ThemedText>

          <View style={s.block}>
            <ThemedText style={s.blockTitle}>{t("serverWeb.title", "Web-App")}</ThemedText>

            <Row label={t("serverWeb.bundle", "Bundle")} value={serverBundle} />
            <Row label={t("serverWeb.release", "WebApp Version (Release)")} value={serverRelease} />
            <Row label={t("serverWeb.full", "WebApp Version (Full)")} value={serverFull} />

            <Row label={t("status", "Update Status")} value={updateStatus} />
            <Row label={t("lastAccepted", "Last accepted")} value={lastAccepted} />
            <Row label={t("lastChecked", "Last checked")} value={lastCheckedAt} />
          </View>

          <View style={s.btnRow}>
            <ActionButton
              label={isChecking ? t("checkNow_loading", "Prüfe…") : t("checkNow", "Jetzt überprüfen")}
              variant="secondary"
              size="xs"
              onPress={checkNow}
              disabled={isChecking || !ip}
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
  title: { fontSize: 20, fontWeight: "700" },

  block: { padding: 14, gap: 10 },
  blockTitle: { fontSize: 16, fontWeight: "700" },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: { fontSize: 12, opacity: 0.75, flex: 1 },
  value: { fontSize: 13, fontWeight: "600" },

  btnRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end", padding: 14 },
  bottom: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 14 },
  fixedBox: { minHeight: 120 },
});