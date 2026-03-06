// src/screens/AppInfoScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";

import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import { H3 } from "../../../components/stylistic/H3";

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

  if (!q) return r;

  const parts = q.split("-").filter(Boolean);
  const last = parts[parts.length - 1]; // "1539"

  // if last is numeric, append with dot: "0.0.4.1539"
  if (last && /^\d+$/.test(last)) return `${r}.${last}`;

  // fallback: keep old behavior
  return `${r}-${q}`;
}

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

function hardReloadWeb(cacheKey: string) {
  if (typeof window === "undefined") return;

  const u = new URL(window.location.href);
  u.searchParams.set("_v", cacheKey); // version-based buster
  u.searchParams.set("_ts", String(Date.now())); // extra safety
  window.location.replace(u.toString());
}

export function UpdateWebAppTab() {
 
  const { t } = useTranslation(["Update"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [serverBundle, setServerBundle] = useState<string>("-");
  const [serverRelease, setServerRelease] = useState<string>("-");
  const [serverFull, setServerFull] = useState<string>("-");

  const [lastAccepted, setLastAccepted] = useState<string>("-");
  const [pendingUpdateFull, setPendingUpdateFull] = useState<string | null>(null);

  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [updateStatus, setUpdateStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const checkNow = useCallback(async () => {
    if (!ip) return;

    setIsChecking(true);
    setLastCheckedAt(new Date().toLocaleString());

    const query = new URLSearchParams();
    query.set("_ts", String(Date.now()));

    const url = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);
    const data = await fetchJsonNoCache({ url, jwt });

    // Network error
    if (data === null) {
      setUpdateStatus(t("serverWeb.statusTexts.networkError"));
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setPendingUpdateFull(null);
      setIsChecking(false);
      return;
    }

    // HTTP error
    if ((data as any)?.__status) {
      const st = Number((data as any).__status);
      setUpdateStatus(
        st === 401
          ? t("serverWeb.statusTexts.unauthorized")
          : t("serverWeb.statusTexts.httpError", { status: st })
      );
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setPendingUpdateFull(null);
      setIsChecking(false);
      return;
    }

    const parsed = extractServerWebApp(data);
    if (!parsed) {
      setUpdateStatus(t("serverWeb.statusTexts.unexpectedFormat"));
      setServerBundle("-");
      setServerRelease("-");
      setServerFull("-");
      setPendingUpdateFull(null);
      setIsChecking(false);
      return;
    }

    const release = fmtRelease(parsed.version);
    const full = fmtFull(parsed.version);

    setServerBundle(parsed.bundleName || "-");
    setServerRelease(release);
    setServerFull(full);

    // read stored accepted baseline
    const acceptedStored = (await AsyncStorage.getItem(LAST_ACCEPTED_KEY)) ?? null;

    if (!acceptedStored) {
      await AsyncStorage.setItem(LAST_ACCEPTED_KEY, full);
      setLastAccepted(full);
      setPendingUpdateFull(null);
      setUpdateStatus(t("serverWeb.statusTexts.upToDate"));
      setIsChecking(false);
      return;
    }

    setLastAccepted(acceptedStored);

    if (acceptedStored !== full) {
      setPendingUpdateFull(full);
      setUpdateStatus(t("serverWeb.statusTexts.updateAvailable", { version: full }));
      setIsChecking(false);
      return;
    }

    setPendingUpdateFull(null);
    setUpdateStatus(t("serverWeb.statusTexts.upToDate"));
    setIsChecking(false);
  }, [ip, jwt, t]);

  const applyUpdateNow = useCallback(async () => {
    if (!pendingUpdateFull) return;

    await AsyncStorage.setItem(LAST_ACCEPTED_KEY, pendingUpdateFull);
    setLastAccepted(pendingUpdateFull);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      hardReloadWeb(pendingUpdateFull);
      return;
    }

    // Native: hier könntest du optional eine Meldung anzeigen
    setPendingUpdateFull(null);
    setUpdateStatus(t("serverWeb.statusTexts.updateAcceptedNative"));
  }, [pendingUpdateFull, t]);

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
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkNow]);

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("serverWeb.title", "Web-App")}</H3>
      
        <Row label={t("serverWeb.fields.releaseVersion")} value={serverRelease} />
        <Row label={t("serverWeb.fields.acceptedVersion")} value={lastAccepted} />
        <Row label={t("serverWeb.fields.status")} value={updateStatus} />

        <View style={s.btnRow}>
          <ActionButton
            label={
              isChecking
                ? t("serverWeb.actions.checking")
                : t("serverWeb.actions.checkNow")
            }
            variant="secondary"
            size="xs"
            onPress={checkNow}
            disabled={isChecking || !ip}
          />
          {pendingUpdateFull ? (
            <ActionButton
              label={t("serverWeb.actions.reloadNow")}
              variant="primary"
              size="xs"
              onPress={applyUpdateNow}
              disabled={isChecking || !ip}
            />
          ) : null}
        </View>
      </View>
    </Card>
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

  btnRow: { flexDirection: "row", gap: 5, justifyContent: "flex-end", padding: 5 },
  bottom: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 14 },
  fixedBox: { minHeight: 120 },
  container: { gap: 14 },
});