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
const MAX_FEATURES_DRAWN = 5;

/* =========================
   Helpers
   ========================= */
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

function includesCI(haystack: string, needle: string) {
  const h = String(haystack ?? "").toLowerCase();
  const n = String(needle ?? "").toLowerCase().trim();
  if (!n) return true;
  return h.includes(n);
}

/**
 * Suche läuft über ALLE Features (features),
 * aber wir geben nur max. 5 Items an die List-Komponente zum Rendern zurück.
 * Optional halten wir das selektierte Feature sichtbar (falls es sonst rausfällt).
 */
function pickTopNWithSelected<T extends { id: string }>(
  all: T[],
  selectedId: string,
  n: number
): T[] {
  const picked = all.slice(0, n);
  if (!selectedId) return picked;

  const alreadyIn = picked.some((x) => x.id === selectedId);
  if (alreadyIn) return picked;

  const selected = all.find((x) => x.id === selectedId);
  if (!selected) return picked;

  // Selected nach oben ziehen, trotzdem max n
  return [selected, ...picked].slice(0, n);
}

/* =========================
   Component
   ========================= */
export function UpdateBackendTab() {
  const { t } = useTranslation(["Update"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [isShowSource, setIsShowSource] = useState<boolean>(true);

  // -> hier liegen ALLE geladenen Einträge
  const [features, setFeatures] = useState<ParsedComponent[]>([]);
  const [bundles, setBundles] = useState<ParsedComponent[]>([]);

  // Suche über ALLE Features, Anzeige aber nur 5
  const [featureQuery, setFeatureQuery] = useState<string>("");

  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");

  const [status, setStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const resetLists = useCallback(() => {
    setFeatures([]);
    setBundles([]);
    setSelectedFeatureId("");
    setSelectedBundleId("");
  }, []);

  const loadFeaturesAndBundles = useCallback(
    async (override?: { featureId?: string; showSource?: boolean }) => {
      if (!ip) return;

      const effectiveFeatureId = override?.featureId ?? selectedFeatureId;
      const effectiveShowSource = override?.showSource ?? isShowSource;

      setIsChecking(true);

      // ---- 1) FEATURES ----
      const q1 = new URLSearchParams();
      q1.set("_ts", String(Date.now()));
      q1.set("type", "FEATURE");
      q1.set("isShowSource", String(effectiveShowSource));

      const urlFeatures = joinUrl(ip, `${API_PREFIX}/version?${q1.toString()}`);
      const dataFeatures = await fetchJsonNoCache({ url: urlFeatures, jwt });

      if (dataFeatures === null) {
        setStatus(t("serverWeb.statusTexts.networkError", "Network error"));
        resetLists();
        setIsChecking(false);
        return;
      }

      if ((dataFeatures as any)?.__status) {
        const st = Number((dataFeatures as any).__status);
        setStatus(
          st === 401
            ? t("serverWeb.statusTexts.unauthorized", "401 (Unauthorized)")
            : t("serverWeb.statusTexts.httpError", {
                status: st,
                defaultValue: `HTTP ${st}`,
              })
        );
        resetLists();
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

      // ---- 2) BUNDLES ----
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
            : t("serverWeb.statusTexts.httpError", {
                status: st,
                defaultValue: `HTTP ${st}`,
              })
        );
        setBundles([]);
        setSelectedBundleId("");
        setIsChecking(false);
        return;
      }

      const parsedBundles = parseSoftwareComponents(dataBundles);

      // Optional: falls der Endpoint auch Features/anderes mitschickt → nur Bundles anzeigen
      const onlyBundles = parsedBundles.filter((x) => String(x.type).toUpperCase() === "BUNDLE");

      setBundles(onlyBundles);
      setSelectedBundleId((prev) =>
        prev && onlyBundles.some((b) => b.id === prev) ? prev : onlyBundles[0]?.id ?? ""
      );

      setStatus(t("serverWeb.statusTexts.upToDate", "Up to date"));
      setIsChecking(false);
    },
    [ip, jwt, selectedFeatureId, isShowSource, t, resetLists]
  );

  const checkNow = useCallback(async () => {
    await loadFeaturesAndBundles();
  }, [loadFeaturesAndBundles]);

  useEffect(() => {
    checkNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Suche über ALLE Features:
  const filteredFeatures = useMemo(() => {
    const q = featureQuery.trim();
    if (!q) return features;
    return features.filter((f) => includesCI(f.name, q) || includesCI(f.id, q) || includesCI(f.type, q));
  }, [features, featureQuery]);

  // Anzeige max 5 (aber selektiertes Feature bleibt sichtbar):
  const drawnFeatures = useMemo(() => {
    return pickTopNWithSelected(filteredFeatures, selectedFeatureId, MAX_FEATURES_DRAWN);
  }, [filteredFeatures, selectedFeatureId]);

  const featureItems = useMemo<SelectableItem<string>[]>(() => {
    return drawnFeatures.map((f) => ({
      id: f.id,
      label: `${f.name} (${fmtFull(f.version)})`,
    }));
  }, [drawnFeatures]);

  const bundleItems = useMemo<SelectableItem<string>[]>(() => {
    return bundles.map((b) => ({
      id: b.id,
      label: `${b.name} (${fmtFull(b.version)})`,
    }));
  }, [bundles]);

  return (
    <Card>
      <View style={s.container}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <H3>{t("backend.title", "Backend")}</H3>
          </View>
          <View style={s.headerRight}>
            <ThemedText style={s.statusLabel}>
              {t("backend.updateStatusBadge", "Update Status")}
            </ThemedText>
            <ThemedText style={s.statusValue}>{status}</ThemedText>
          </View>
          <View style={s.headerButtons}>
            <ActionButton
              label={    t("serverWeb.actions.checkNow", "Jetzt überprüfen") }
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
        {/* Installed Features */}
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <ThemedText style={s.sectionTitle}>
              {t("backend.sections.installedFeatures", "Installed Features")}
            </ThemedText>
          </View>
          <SelectableList<string>
            items={featureItems}
            value={selectedFeatureId || (featureItems[0]?.id ?? "")}
            onChange={(id) => {
              setSelectedFeatureId(id);
              setSelectedBundleId("");
              loadFeaturesAndBundles({ featureId: id });
            }}
            maxHeight={190}
            minVisibleRows={5}
            size="xs0"
            variant="secondary"
            emptyText={t("backend.empty.noFeatures", "No features")}
          />
        </View>

        {/* Bundles */}
        <View style={s.section}>
          <ThemedText style={s.sectionTitle}>{t("backend.sections.bundles", "Bundles")}</ThemedText>
          <SelectableList<string>
            items={bundleItems}
            value={selectedBundleId || (bundleItems[0]?.id ?? "")}
            onChange={(id) => setSelectedBundleId(id)}
            maxHeight={220}
            minVisibleRows={5}
            size="xs0"
            variant="secondary"
            emptyText={t("backend.empty.noBundles", "No bundles")}
          />
        </View>
      </View>
    </Card>
  );
}

/* =========================
   Styles (Responsive Header)
   ========================= */
const s = StyleSheet.create({
  container: { gap: 14 },

  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  headerLeft: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 160,
    gap: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    minWidth: 170,
  },

  statusLabel: { opacity: 0.85 },
  statusValue: { fontWeight: "700" },

  headerButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    flexBasis: "100%",
    justifyContent: "flex-start",
  },

  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", opacity: 0.9 },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  quickFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  helperText: { fontSize: 12, opacity: 0.75 },
});