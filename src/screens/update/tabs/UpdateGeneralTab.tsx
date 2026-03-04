import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import { H2 } from "../../../components/stylistic/H2";
import { H3 } from "../../../components/stylistic/H3";

const API_PREFIX = "/api";

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

function getBundleVersion(data: any, bundleId: string): string | null {
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
  const { t } = useTranslation(["Settings.AppInfo"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const [webRelease, setWebRelease] = useState("-");
  const [backendRelease, setBackendRelease] = useState("-");

  const load = useCallback(async () => {
    if (!ip) {
      setWebRelease("-");
      setBackendRelease("-");
      return;
    }

    // 1) Versuch: WEBAPP (wenn Backend das unterstützt)
    const webUrl = joinUrl(ip, `${API_PREFIX}/version?type=WEBAPP&_ts=${Date.now()}`);
    const webData = await fetchJsonNoCache(webUrl, jwt);

    // Wenn WEBAPP nicht existiert oder leer ist -> "-"
    const webList = webData?.SoftwareComponentList ?? webData?.softwareComponentList;
    if (Array.isArray(webList) && webList.length > 0) {
      // nimm den ersten WEBAPP-Eintrag
      const version = webList[0]?.version ?? webList[0]?.Version;
      if (version && typeof version === "object") {
        setWebRelease(
          fmtRelease({
            major: Number(version?.major ?? version?.Major ?? 0),
            minor: Number(version?.minor ?? version?.Minor ?? 0),
            micro: Number(version?.micro ?? version?.Micro ?? 0),
            qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
          })
        );
      } else {
        setWebRelease("-");
      }
    } else {
      setWebRelease("-");
    }


    const backendUrl = joinUrl(ip, `${API_PREFIX}/version?_ts=${Date.now()}`);
    const backendData = await fetchJsonNoCache(backendUrl, jwt);

    if (!backendData) {
      setBackendRelease("-");
      return;
    }

    const vPlatform = getBundleVersion(backendData, "org.eclipse.platform");
    const vRcp = getBundleVersion(backendData, "org.eclipse.rcp");
    const vSdk = getBundleVersion(backendData, "org.eclipse.sdk");

    setBackendRelease(vPlatform ?? vRcp ?? vSdk ?? "-");
  }, [ip, jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("general.title", "General")}</H3>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>{t("general.webapp", "Web-App")}</ThemedText>
          <Row label={t("general.webRelease", "Server Version (Release)")} value={webRelease} />
        </View>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>{t("general.backend", "Backend")}</ThemedText>
          <Row label={t("general.backendRelease", "System Version (Release)")} value={backendRelease} />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  container: { gap: 14 },
  title: { fontSize: 18, fontWeight: "700" },
  block: { gap: 8, paddingTop: 6 },
  blockTitle: { fontSize: 14, fontWeight: "700", opacity: 0.9 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 12, opacity: 0.75, flex: 1 },
  value: { fontSize: 13, fontWeight: "600" },
});