import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import { H3 } from "../../../components/stylistic/H3";

const API_PREFIX = "/api";


const LAST_ACCEPTED_WEB_KEY = "appInfo_lastAcceptedServerWebAppVersionFull";
const LAST_ACCEPTED_BACKEND_KEY = "appInfo_lastAcceptedBackendVersionRelease";

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}
function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type ApiVersion = { major?: number; minor?: number; micro?: number; qualifier?: string };

function fmtRelease(v?: ApiVersion | null) {
  return `${v?.major ?? 0}.${v?.minor ?? 0}.${v?.micro ?? 0}`;
}

function fmtFull(v?: ApiVersion | null) {
  const r = fmtRelease(v);
  const q = String(v?.qualifier ?? "").trim();
  return q ? `${r}-${q}` : r;
}

async function fetchJsonNoCache(url: string, jwt: string | null) {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store" as any,
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getBundleVersionRelease(data: any, bundleId: string): string | null {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list)) return null;

  const item = list.find((x: any) => String(x?.ID ?? x?.id ?? "") === bundleId);
  if (!item) return null;

  const version = item?.version ?? item?.Version;
  if (!version || typeof version !== "object") return null;

  const v: ApiVersion = {
    major: Number(version?.major ?? version?.Major ?? 0),
    minor: Number(version?.minor ?? version?.Minor ?? 0),
    micro: Number(version?.micro ?? version?.Micro ?? 0),
    qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
  };

  return fmtRelease(v);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <ThemedText style={s.label}>{label}</ThemedText>
      <ThemedText style={s.value}>{value || "-"}</ThemedText>
    </View>
  );
}

export function UpdateGeneralTab() {

  const { t } = useTranslation(["Update"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

 
  const [webStatus, setWebStatus] = useState("-");
  const [backendStatus, setBackendStatus] = useState("-");

  const load = useCallback(async () => {
    if (!ip) {
      setWebStatus("-");
      setBackendStatus("-");
      return;
    }

    /* -----------------------
       WEBAPP Status
       ----------------------- */
    const webUrl = joinUrl(ip, `${API_PREFIX}/version?type=WEBAPP&_ts=${Date.now()}`);
    const webData = await fetchJsonNoCache(webUrl, jwt);

    // hole server full (release + qualifier wenn vorhanden)
    let serverWebFull: string | null = null;
    const webList = webData?.SoftwareComponentList ?? webData?.softwareComponentList;

    if (Array.isArray(webList) && webList.length > 0) {
      const version = webList[0]?.version ?? webList[0]?.Version;
      if (version && typeof version === "object") {
        serverWebFull = fmtFull({
          major: Number(version?.major ?? version?.Major ?? 0),
          minor: Number(version?.minor ?? version?.Minor ?? 0),
          micro: Number(version?.micro ?? version?.Micro ?? 0),
          qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
        });
      }
    }

    if (!serverWebFull) {
      setWebStatus("-");
    } else {
      const acceptedWeb = await AsyncStorage.getItem(LAST_ACCEPTED_WEB_KEY);

      // wenn noch nie gesetzt -> baseline setzen und als "Aktuell" anzeigen
      if (!acceptedWeb) {
        await AsyncStorage.setItem(LAST_ACCEPTED_WEB_KEY, serverWebFull);
        setWebStatus(t("serverWeb.statusTexts.upToDate"));
      } else if (acceptedWeb === serverWebFull) {
        setWebStatus(t("serverWeb.statusTexts.upToDate"));
      } else {
       
        setWebStatus(t("serverWeb.statusTexts.updateAvailable", { version: "" }).replace(/[:\s-]*\{\{version\}\}/g, "").trim() || t("serverWeb.statusTexts.updateAvailable", { version: serverWebFull }));
      
      }
    }

    /* -----------------------
       BACKEND Status
       ----------------------- */
    const backendUrl = joinUrl(ip, `${API_PREFIX}/version?_ts=${Date.now()}`);
    const backendData = await fetchJsonNoCache(backendUrl, jwt);

    if (!backendData) {
      setBackendStatus("-");
      return;
    }

    const serverBackendRelease =
      getBundleVersionRelease(backendData, "org.eclipse.platform") ??
      getBundleVersionRelease(backendData, "org.eclipse.rcp") ??
      getBundleVersionRelease(backendData, "org.eclipse.sdk");

    if (!serverBackendRelease) {
      setBackendStatus("-");
      return;
    }

    const acceptedBackend = await AsyncStorage.getItem(LAST_ACCEPTED_BACKEND_KEY);

    if (!acceptedBackend) {
      await AsyncStorage.setItem(LAST_ACCEPTED_BACKEND_KEY, serverBackendRelease);
      setBackendStatus(t("serverWeb.statusTexts.upToDate"));
    } else if (acceptedBackend === serverBackendRelease) {
      setBackendStatus(t("serverWeb.statusTexts.upToDate"));
    } else {
      
      setBackendStatus(
        t("serverWeb.statusTexts.updateAvailable", { version: "" })
          .replace(/[:\s-]*\{\{version\}\}/g, "")
          .trim()
      );
    }
  }, [ip, jwt, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("general.title", "General")}</H3>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>{t("general.webapp", "Web-App")}</ThemedText>
          <Row label={t("general.webStatus", "Status")} value={webStatus} />
        </View>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>{t("general.backend", "Backend")}</ThemedText>
          <Row label={t("general.backendStatus", "Status")} value={backendStatus} />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  container: { gap: 14 },
  block: { gap: 8, paddingTop: 6 },
  blockTitle: { fontSize: 14, fontWeight: "700", opacity: 0.9 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 12, opacity: 0.75, flex: 1 },
  value: { fontSize: 13, fontWeight: "600" },
});