// UpdateBackendTab.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import { SelectableList, SelectableItem } from "../../../components/ui-elements/SelectableList";
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
  const r = fmtRelease(v);
  const q = String(v?.qualifier ?? "").trim();
  return q ? `${r}-${q}` : r;
}

type BackendType = "FEATURE" | "BUNDLE" | "BUNDLE_OF_FEATURE";

type ParsedComponent = {
  id: string;
  name: string;
  type: string;
  version: ApiVersion;
  raw?: any;
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

function uniqById(list: ParsedComponent[]) {
  const seen = new Set<string>();
  const out: ParsedComponent[] = [];
  for (const x of list) {
    const id = String(x?.id ?? "");
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(x);
  }
  return out;
}

function parseSoftwareComponents(data: any): ParsedComponent[] {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list)) return [];

  const parsed = list.map((x: any, idx: number) => {
    const version = x?.version ?? x?.Version;
    const vObj =
      version && typeof version === "object"
        ? {
            major: Number(version?.major ?? version?.Major ?? 0),
            minor: Number(version?.minor ?? version?.Minor ?? 0),
            micro: Number(version?.micro ?? version?.Micro ?? 0),
            qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
          }
        : { major: 0, minor: 0, micro: 0, qualifier: "" };

    const id = String(x?.ID ?? x?.id ?? x?.Id ?? `${idx}`);
    const name = String(x?.name ?? x?.Name ?? "-");
    const type = String(x?.componentType ?? x?.ComponentType ?? x?.type ?? "-");

    return { id, name, type, version: vObj, raw: x } as ParsedComponent;
  });

  return uniqById(parsed);
}

export function UpdateBackendTab() {
  const { t } = useTranslation(["Update"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [isShowSource, setIsShowSource] = useState<boolean>(true);

  const [features, setFeatures] = useState<ParsedComponent[]>([]);
  const [bundles, setBundles] = useState<ParsedComponent[]>([]);

  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");

  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [status, setStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const loadFeaturesAndBundles = useCallback(
    async (override?: { featureId?: string; showSource?: boolean }) => {
      if (!ip) return;

      const effectiveFeatureId = override?.featureId ?? selectedFeatureId;
      const effectiveShowSource = override?.showSource ?? isShowSource;

      setIsChecking(true);
      setLastCheckedAt(new Date().toLocaleString());

      // ---- 1) FEATURES ----
      const q1 = new URLSearchParams();
      q1.set("_ts", String(Date.now()));
      q1.set("type", "FEATURE");
      q1.set("isShowSource", String(effectiveShowSource));

      const urlFeatures = joinUrl(ip, `${API_PREFIX}/version?${q1.toString()}`);
      const dataFeatures = await fetchJsonNoCache({ url: urlFeatures, jwt });

      if (dataFeatures === null) {
        setStatus(t("serverWeb.statusTexts.networkError", "Network error"));
        setFeatures([]);
        setBundles([]);
        setSelectedFeatureId("");
        setSelectedBundleId("");
        setIsChecking(false);
        return;
      }

      if ((dataFeatures as any)?.__status) {
        const st = Number((dataFeatures as any).__status);
        setStatus(
          st === 401
            ? t("serverWeb.statusTexts.unauthorized", "401 (Unauthorized)")
            : t("serverWeb.statusTexts.httpError", { status: st, defaultValue: `HTTP ${st}` })
        );
        setFeatures([]);
        setBundles([]);
        setSelectedFeatureId("");
        setSelectedBundleId("");
        setIsChecking(false);
        return;
      }

      const parsedFeatures = parseSoftwareComponents(dataFeatures);
      setFeatures(parsedFeatures);

      const nextFeatureId =
        effectiveFeatureId && parsedFeatures.some((x) => x.id === effectiveFeatureId)
          ? effectiveFeatureId
          : parsedFeatures[0]?.id ?? "";

      setSelectedFeatureId(nextFeatureId);

   
      const bundleType: BackendType = nextFeatureId ? "BUNDLE_OF_FEATURE" : "BUNDLE";

      const q2 = new URLSearchParams();
      q2.set("_ts", String(Date.now()));
      q2.set("type", bundleType);
      q2.set("isShowSource", String(effectiveShowSource));

   
      if (bundleType === "BUNDLE_OF_FEATURE") {
        q2.set("filter", nextFeatureId);
      }

      const urlBundles = joinUrl(ip, `${API_PREFIX}/version?${q2.toString()}`);
      const dataBundles = await fetchJsonNoCache({ url: urlBundles, jwt });

      if (dataBundles === null) {
        setStatus(t("serverWeb.statusTexts.networkError", "Network error"));
        setBundles([]);
        setSelectedBundleId("");
        setIsChecking(false);
        return;
      }

      if ((dataBundles as any)?.__status) {
        const st = Number((dataBundles as any).__status);
        setStatus(
          st === 401
            ? t("serverWeb.statusTexts.unauthorized", "401 (Unauthorized)")
            : t("serverWeb.statusTexts.httpError", { status: st, defaultValue: `HTTP ${st}` })
        );
        setBundles([]);
        setSelectedBundleId("");
        setIsChecking(false);
        return;
      }

      const parsedBundles = parseSoftwareComponents(dataBundles);

    
      const onlyBundles = parsedBundles.filter(
        (x) => String(x.type).toUpperCase() === "BUNDLE"
      );

      setBundles(onlyBundles);

      setSelectedBundleId((prev) =>
        prev && onlyBundles.some((b) => b.id === prev) ? prev : onlyBundles[0]?.id ?? ""
      );

      setStatus(t("serverWeb.statusTexts.upToDate", "Up to date"));
      setIsChecking(false);
    },
    [ip, jwt, selectedFeatureId, isShowSource, t]
  );

  const checkNow = useCallback(async () => {
    await loadFeaturesAndBundles();
  }, [loadFeaturesAndBundles]);

  useEffect(() => {
    checkNow();
    
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      checkNow();
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkNow]);

  const featureItems = useMemo<SelectableItem<string>[]>(() => {
    return features.map((f) => ({
      id: f.id, 
      label: `${f.name} (${fmtFull(f.version)})`,
    }));
  }, [features]);

  const bundleItems = useMemo<SelectableItem<string>[]>(() => {
    return bundles.map((b) => ({
      id: b.id,
      label: `${b.name} (${fmtFull(b.version)})`,
    }));
  }, [bundles]);

  return (
    <Card>
      <View style={s.container}>
     
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <H3>{t("backend.title", "Backend")}</H3>    
          </View>

            <View style={s.headerRight}>
               <ThemedText > {t("backend.updateStatusBadge", "Update Status")} </ThemedText>           
               <ThemedText>{status}</ThemedText>
             </View>

            <View style={s.headerButtons}>
              <ActionButton
                label={
                  isChecking
                    ? t("serverWeb.actions.checking", "Prüfe…")
                    : t("serverWeb.actions.checkNow", "Jetzt überprüfen")
                }
                variant="secondary"
                size="xs"
                onPress={checkNow}
                disabled={isChecking || !ip}
              />

              <ActionButton
                label={isShowSource ? "Source: ON" : "Source: OFF"}
                variant="secondary"
                size="xs"
                onPress={() => {
                  const next = !isShowSource;
                  setIsShowSource(next);
                  loadFeaturesAndBundles({ showSource: next });
                }}
                disabled={isChecking}
              />
            </View>
          </View>
        </View>

        {/* Installed Features */}
        <View style={s.section}>
          <ThemedText style={s.sectionTitle}>
            {t("backend.sections.installedFeatures", "Installed Features")}
          </ThemedText>

          <SelectableList<string>
            items={featureItems}
            value={selectedFeatureId || (featureItems[0]?.id ?? "")}
            onChange={(id) => {
              setSelectedFeatureId(id);
              setSelectedBundleId("");
              loadFeaturesAndBundles({ featureId: id });
            }}
            maxHeight={190}
            minVisibleRows={4}
            size="xs"
            variant="secondary"
            emptyText={t("backend.empty.noFeatures", "No features")}
          />
        </View>

        {/* Bundles */}
        <View style={s.section}>
          <ThemedText style={s.sectionTitle}>
            {t("backend.sections.bundles", "Bundles")}
          </ThemedText>

          <SelectableList<string>
            items={bundleItems}
            value={selectedBundleId || (bundleItems[0]?.id ?? "")}
            onChange={(id) => setSelectedBundleId(id)}
            maxHeight={220}
            minVisibleRows={5}
            size="xs"
            variant="secondary"
            emptyText={t("backend.empty.noBundles", "No bundles")}
          />
        </View>

        <View style={s.footerRow}>
          <ThemedText style={s.footerText}>
            {t("backend.labels.lastChecked", "Last checked")}: {lastCheckedAt}
          </ThemedText>
        </View>
   
    </Card>
  );
}

const s = StyleSheet.create({
  container: { gap: 14 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  headerLeft: { gap: 6, flexShrink: 1 },
  headerRight: {gap: 6, flexDirection: "row", alignItems: "center" },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  headerStatus: { fontSize: 13, fontWeight: "700" },
  headerButtons: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },

  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", opacity: 0.9 },

  footerRow: { paddingTop: 4 },
  footerText: { fontSize: 11, opacity: 0.7 },
});