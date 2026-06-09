import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import {getServerScopedStorageKey,normalizeServerKey,} from "../../../redux/selectors/serverSelectors";
import { H3 } from "../../../components/stylistic/H3";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { loadUpdateSettings,checkFrontendUpdate } from "../../../redux/slices/updateSlice";

//********************************************************************************************************** */
const LAST_ACCEPTED_KEY_PREFIX = "appInfo_lastAcceptedServerWebAppVersionFull";
const API_PREFIX = "/api";
function joinUrl(base: string, path: string) {
  const b = normalizeServerKey(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string;
};

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

function hardReloadWeb(cacheKey: string) {
  if (typeof window === "undefined") return;

  const u = new URL(window.location.href);
  u.searchParams.set("_v", cacheKey);
  u.searchParams.set("_ts", String(Date.now()));
  window.location.replace(u.toString());
}

export function UpdateWebAppTab() {
  const { t } = useTranslation(["Update"]);
  const api = useAppSelector(selectApi);
  const dispatch = useAppDispatch();
  const updateState = useAppSelector((state) => state.update);
  const ip = api.ip;
  const jwt = api.jwt;
  const activeServerKey = normalizeServerKey(ip);
  const storageKey = getServerScopedStorageKey(LAST_ACCEPTED_KEY_PREFIX,ip,);
  const intervalRef = useRef<any>(null);
  const [serverBundle, setServerBundle] = useState<string>("-");
  const [serverRelease, setServerRelease] = useState<string>("-");
  const [serverFull, setServerFull] = useState<string>("-");
  const [lastAccepted, setLastAccepted] = useState<string>("-");
  const [pendingUpdateFull, setPendingUpdateFull] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [updateStatus, setUpdateStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);
  useEffect(() => {
  setUpdateStatus(
        updateState.frontend.isAvailable
          ? t("serverWeb.statusTexts.updateAvailable", {
              version: updateState.frontend.version,
            })
          : t("serverWeb.statusTexts.upToDate"),
      );

      if (updateState.frontend.lastCheck) {
        setLastCheckedAt(updateState.frontend.lastCheck);
      }
    }, [updateState.frontend, t]);

  const resetLocalState = useCallback(() => {
    setServerBundle("-");
    setServerRelease("-");
    setServerFull("-");
    setLastAccepted("-");
    setPendingUpdateFull(null);
    setLastCheckedAt("-");
    setUpdateStatus("-");
    setIsChecking(false);
  }, []);

  useEffect(() => {
                   dispatch(loadUpdateSettings());
                  }, [dispatch]);

    useEffect(() => {
                     console.log("UPDATE STATE", updateState);
                    }, [updateState]);

 const checkNow = useCallback(async () => {
  if (!ip) return;

  setIsChecking(true);

  await dispatch(checkFrontendUpdate());
  await dispatch(loadUpdateSettings());

  setIsChecking(false);
  return;


  }, [ip, jwt, storageKey, t]);

  const applyUpdateNow = useCallback(async () => {
    if (!pendingUpdateFull) return;

    await AsyncStorage.setItem(storageKey, pendingUpdateFull);
    setLastAccepted(pendingUpdateFull);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      hardReloadWeb(pendingUpdateFull);
      return;
    }

    setPendingUpdateFull(null);
    //setUpdateStatus(t("serverWeb.statusTexts.updateAcceptedNative"));
  }, [pendingUpdateFull, storageKey, t]);

  useEffect(() => {
    if (!ip) {
      resetLocalState();
      return;
    }

    resetLocalState();

    (async () => {
      const acceptedRaw = await AsyncStorage.getItem(storageKey);
      if (acceptedRaw) {
        setLastAccepted(acceptedRaw);
      }
      await checkNow();
    })();
  }, [activeServerKey, storageKey, checkNow, ip, resetLocalState]);

  useEffect(() => {
    if (!ip) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      void checkNow();
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkNow, ip, activeServerKey]);

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("serverWeb.title", "Web-App")}</H3>
        <Row label={t("serverWeb.fields.acceptedVersion")} value={updateState.frontend.currentVersion || lastAccepted}/>
        <Row label={t("serverWeb.fields.newVersion", "Neue Version")} value={updateState.frontend.newVersion || updateState.frontend.version || "-"}/>
        <Row label={t("serverWeb.fields.status")} value={updateStatus} />
        <Row label={t("serverWeb.fields.lastCheck", "Letzte Prüfung")} value={lastCheckedAt}/>

        <View style={s.btnRow}>
          {!updateState.frontend.isAvailable && !updateState.autoUpdate && (
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
          )}

          {updateState.frontend.isAvailable && (
            <ActionButton
              label={t("serverWeb.actions.reloadNow")}
              variant="primary"
              size="xs"
              onPress={() => window.location.reload()}
              disabled={isChecking}
            />
          )}
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

  btnRow: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
    padding: 5,
  },
  bottom: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 14 },
  fixedBox: { minHeight: 120 },
  container: { gap: 14 },
});