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
import {
  getServerScopedStorageKey,
  normalizeServerKey,
} from "../../../redux/selectors/serverSelectors";

const API_PREFIX = "/api";

const LAST_ACCEPTED_KEY_PREFIX = "appInfo_lastAcceptedServerWebAppVersionFull";
const LAST_ACCEPTED_BACKEND_KEY = "appInfo_lastAcceptedBackendVersionRelease";

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string;
};

function joinUrl(base: string, path: string) {
  const b = normalizeServerKey(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function fmtRelease(v: ApiVersion | null | undefined) {
  const major = v?.major ?? 0;
  const minor = v?.minor ?? 0;
  const micro = v?.micro ?? 0;
  return `${major}.${minor}.${micro}`;
}

function fmtFull(v: ApiVersion | null | undefined) {
  const major = v?.major ?? 0;
  const minor = v?.minor ?? 0;
  const micro = v?.micro ?? 0;

  const base = `${major}.${minor}.${micro}`;
  const q = String(v?.qualifier ?? "").trim();

  if (!q) return base;

  const normalizedQualifier = q
    .replace(/[^0-9A-Za-z]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  return normalizedQualifier ? `${base}.${normalizedQualifier}` : base;
}

function extractServerWebApp(data: any): {
  bundleName: string;
  version: ApiVersion;
  id?: string;
} | null {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list) || list.length === 0) return null;

  const item =
    list.find(
      (x: any) => String(x?.componentType ?? "").toUpperCase() === "WEBAPP",
    ) ?? list[0];

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

function getBundleVersionRelease(data: any, bundleId: string): string | null {
  const list = getSoftwareComponentList(data);

  const item = list.find((x: any) => String(x?.ID ?? x?.id ?? "") === bundleId);
  if (!item) return null;

  const version = parseVersionObject(item?.version ?? item?.Version);
  if (!version) return null;

  return fmtRelease(version);
}

async function fetchJsonNoCache(params: { url: string; jwt: string | null }) {
  try {
    const res = await fetch(params.url, {
      method: "GET",
      cache: "no-store" as any,
      headers: params.jwt
        ? { Authorization: `Bearer ${params.jwt}` }
        : undefined,
    });

    if (!res.ok) return { __status: res.status };
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeStoredVersion(value: string | null) {
  if (!value) return null;

  return String(value)
    .trim()
    .replace(/-/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
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
  const webStorageKey = getServerScopedStorageKey(LAST_ACCEPTED_KEY_PREFIX, ip);

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
         exakt wie UpdateWebAppTab
         ----------------------- */
      const query = new URLSearchParams();
      query.set("_ts", String(Date.now()));

      const webUrl = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);
      const webData = await fetchJsonNoCache({ url: webUrl, jwt });

      if (webData === null) {
        setWebStatus(t("serverWeb.statusTexts.networkError"));
      } else if ((webData as any)?.__status) {
        const st = Number((webData as any).__status);
        setWebStatus(
          st === 401
            ? t("serverWeb.statusTexts.unauthorized")
            : t("serverWeb.statusTexts.httpError", { status: st }),
        );
      } else {
        const parsed = extractServerWebApp(webData);

        if (!parsed) {
          setWebStatus(t("serverWeb.statusTexts.unexpectedFormat"));
        } else {
          const full = fmtFull(parsed.version);
          const acceptedStored =
            (await AsyncStorage.getItem(webStorageKey)) ?? null;

          if (!acceptedStored) {
            await AsyncStorage.setItem(webStorageKey, full);
            setWebStatus(t("serverWeb.statusTexts.upToDate"));
          } else if (acceptedStored !== full) {
            setWebStatus(
              t("serverWeb.statusTexts.updateAvailable", { version: full }),
            );
          } else {
            setWebStatus(t("serverWeb.statusTexts.upToDate"));
          }
        }
      }

      /* -----------------------
         BACKEND Status
         ----------------------- */
      const backendUrl = joinUrl(ip, `${API_PREFIX}/version?_ts=${Date.now()}`);
      const backendData = await fetchJsonNoCache({ url: backendUrl, jwt });

      if (backendData === null) {
        setBackendStatus(t("serverWeb.statusTexts.networkError"));
        return;
      }

      if ((backendData as any)?.__status) {
        const st = Number((backendData as any).__status);
        setBackendStatus(
          st === 401
            ? t("serverWeb.statusTexts.unauthorized")
            : t("serverWeb.statusTexts.httpError", { status: st }),
        );
        return;
      }

      const serverBackendReleaseRaw =
        getBundleVersionRelease(backendData, "org.eclipse.platform") ??
        getBundleVersionRelease(backendData, "org.eclipse.rcp") ??
        getBundleVersionRelease(backendData, "org.eclipse.sdk");

      const serverBackendRelease = normalizeStoredVersion(
        serverBackendReleaseRaw,
      );

      if (!serverBackendRelease) {
        setBackendStatus(t("--"));
        return;
      }

      const acceptedBackendRaw =
        await AsyncStorage.getItem(LAST_ACCEPTED_BACKEND_KEY);
      const acceptedBackend = normalizeStoredVersion(acceptedBackendRaw);

      if (
        acceptedBackendRaw &&
        acceptedBackend &&
        acceptedBackendRaw !== acceptedBackend
      ) {
        await AsyncStorage.setItem(LAST_ACCEPTED_BACKEND_KEY, acceptedBackend);
      }

      if (!acceptedBackend) {
        await AsyncStorage.setItem(
          LAST_ACCEPTED_BACKEND_KEY,
          serverBackendRelease,
        );
        setBackendStatus(t("serverWeb.statusTexts.upToDate"));
      } else if (acceptedBackend === serverBackendRelease) {
        setBackendStatus(t("serverWeb.statusTexts.upToDate"));
      } else {
        setBackendStatus(
          t("serverWeb.statusTexts.updateAvailable", {
            version: serverBackendRelease,
          }),
        );
      }
    } catch (err) {
      console.log("[UpdateGeneralTab] load error", err);
      setWebStatus("-");
      setBackendStatus("-");
    }
  }, [ip, jwt, t, webStorageKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("general.title", "General")}</H3>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>
            {t("general.webapp", "Web-App")}
          </ThemedText>
          <Row label={t("general.webStatus", "Status")} value={webStatus} />
        </View>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>
            {t("general.backend", "Backend")}
          </ThemedText>
          <Row
            label={t("general.backendStatus", "Status")}
            value={backendStatus}
          />
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