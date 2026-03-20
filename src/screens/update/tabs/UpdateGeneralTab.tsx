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

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string;
};

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function fmtRelease(v?: ApiVersion | null) {
  return `${v?.major ?? 0}.${v?.minor ?? 0}.${v?.micro ?? 0}`;
}

function normalizeQualifier(q?: string | null) {
  return String(q ?? "")
    .trim()
    .replace(/[^0-9A-Za-z]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function fmtFull(v?: ApiVersion | null) {
  const base = fmtRelease(v);
  const qualifier = normalizeQualifier(v?.qualifier);
  return qualifier ? `${base}.${qualifier}` : base;
}

function normalizeStoredVersion(value: string | null) {
  if (!value) return null;

  return String(value)
    .trim()
    .replace(/-/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function parseVersionObject(version: any): ApiVersion | null {
  if (!version || typeof version !== "object") return null;

  return {
    major: Number(version?.major ?? version?.Major ?? 0),
    minor: Number(version?.minor ?? version?.Minor ?? 0),
    micro: Number(version?.micro ?? version?.Micro ?? 0),
    qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
  };
}

function getSoftwareComponentList(data: any): any[] {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  return Array.isArray(list) ? list : [];
}

function findWebAppComponent(data: any) {
  const list = getSoftwareComponentList(data);

  return (
    list.find(
      (x: any) =>
        String(x?.componentType ?? x?.ComponentType ?? "").toUpperCase() === "WEBAPP"
    ) ?? null
  );
}

function getWebAppVersionFull(data: any): string | null {
  const item = findWebAppComponent(data);
  if (!item) return null;

  const version = parseVersionObject(item?.version ?? item?.Version);
  if (!version) return null;

  return fmtFull(version);
}

function getBundleVersionRelease(data: any, bundleId: string): string | null {
  const list = getSoftwareComponentList(data);

  const item = list.find((x: any) => String(x?.ID ?? x?.id ?? "") === bundleId);
  if (!item) return null;

  const version = parseVersionObject(item?.version ?? item?.Version);
  if (!version) return null;

  return fmtRelease(version);
}

async function fetchJsonNoCache(url: string, jwt: string | null) {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store" as any,
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    });

    if (!res.ok) {
      console.log("[UpdateGeneralTab] HTTP error", res.status, url);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.log("[UpdateGeneralTab] Network error", url, err);
    return null;
  }
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

    try {
      /* -----------------------
         WEBAPP Status
         ----------------------- */
      const webUrl = joinUrl(ip, `${API_PREFIX}/version?type=WEBAPP&_ts=${Date.now()}`);
      const webData = await fetchJsonNoCache(webUrl, jwt);

      const serverWebFullRaw = getWebAppVersionFull(webData);
      const serverWebFull = normalizeStoredVersion(serverWebFullRaw);

      console.log("[WEB] server raw:", serverWebFullRaw);
      console.log("[WEB] server normalized:", serverWebFull);

      if (!serverWebFull) {
        setWebStatus("-");
      } else {
        const acceptedWebRaw = await AsyncStorage.getItem(LAST_ACCEPTED_WEB_KEY);
        const acceptedWeb = normalizeStoredVersion(acceptedWebRaw);

        console.log("[WEB] accepted raw:", acceptedWebRaw);
        console.log("[WEB] accepted normalized:", acceptedWeb);

        // alte gespeicherte Formate direkt angleichen
        if (acceptedWebRaw && acceptedWeb && acceptedWebRaw !== acceptedWeb) {
          await AsyncStorage.setItem(LAST_ACCEPTED_WEB_KEY, acceptedWeb);
        }

        if (!acceptedWeb) {
          await AsyncStorage.setItem(LAST_ACCEPTED_WEB_KEY, serverWebFull);
          console.log("[WEB] baseline set:", serverWebFull);
          setWebStatus(t("serverWeb.statusTexts.upToDate"));
        } else if (acceptedWeb === serverWebFull) {
          console.log("[WEB] status: upToDate");
          setWebStatus(t("serverWeb.statusTexts.upToDate"));
        } else {
          console.log("[WEB] status: updateAvailable", {
            acceptedWeb,
            serverWebFull,
          });
          setWebStatus(
            t("serverWeb.statusTexts.updateAvailable", { version: serverWebFull })
          );
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

      const serverBackendReleaseRaw =
        getBundleVersionRelease(backendData, "org.eclipse.platform") ??
        getBundleVersionRelease(backendData, "org.eclipse.rcp") ??
        getBundleVersionRelease(backendData, "org.eclipse.sdk");

      const serverBackendRelease = normalizeStoredVersion(serverBackendReleaseRaw);

      console.log("[BACKEND] server raw:", serverBackendReleaseRaw);
      console.log("[BACKEND] server normalized:", serverBackendRelease);

      if (!serverBackendRelease) {
        setBackendStatus("-");
        return;
      }

      const acceptedBackendRaw = await AsyncStorage.getItem(LAST_ACCEPTED_BACKEND_KEY);
      const acceptedBackend = normalizeStoredVersion(acceptedBackendRaw);

      console.log("[BACKEND] accepted raw:", acceptedBackendRaw);
      console.log("[BACKEND] accepted normalized:", acceptedBackend);

      if (acceptedBackendRaw && acceptedBackend && acceptedBackendRaw !== acceptedBackend) {
        await AsyncStorage.setItem(LAST_ACCEPTED_BACKEND_KEY, acceptedBackend);
      }

      if (!acceptedBackend) {
        await AsyncStorage.setItem(LAST_ACCEPTED_BACKEND_KEY, serverBackendRelease);
        console.log("[BACKEND] baseline set:", serverBackendRelease);
        setBackendStatus(t("serverWeb.statusTexts.upToDate"));
      } else if (acceptedBackend === serverBackendRelease) {
        console.log("[BACKEND] status: upToDate");
        setBackendStatus(t("serverWeb.statusTexts.upToDate"));
      } else {
        console.log("[BACKEND] status: updateAvailable", {
          acceptedBackend,
          serverBackendRelease,
        });
        setBackendStatus(
          t("serverWeb.statusTexts.updateAvailable", {
            version: serverBackendRelease,
          })
        );
      }
    } catch (err) {
      console.log("[UpdateGeneralTab] load error", err);
      setWebStatus("-");
      setBackendStatus("-");
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