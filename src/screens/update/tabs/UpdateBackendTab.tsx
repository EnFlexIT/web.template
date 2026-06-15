import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";

import {
  logoutAsync,
  selectApi,
  selectAuthenticationMethod,
} from "../../../redux/slices/apiSlice";

import { setLogoutFlowActive } from "../../../redux/slices/logoutFlowGuard";

import {
  checkBackendUpdate,
  executeBackendUpdate,
  loadUpdateSettingsIfNeeded,
} from "../../../redux/slices/updateSlice";

import { checkServerReachable} from "../../login/serverCheck";

import { BackendUpdateProgressDialog } from "../Dialog/BackendUpdateProgressDialog";

import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";
import {
  SelectableItem,
  SelectableList,
} from "../../../components/ui-elements/SelectableList";
import { H3 } from "../../../components/stylistic/H3";

const API_PREFIX = "/api";
const MAX_FEATURES_DRAWN = 5;

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string;
};

type ParsedComponent = {
  id: string;
  name: string;
  type: string;
  version: ApiVersion;
  raw?: any;
};

type LoadOptions = {
  featureId?: string;
};

type BackendUpdatePhase =
  | "installing"
  | "restarting"
  | "reconnecting"
  | "logout";

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function fmtRelease(v: ApiVersion | null | undefined) {
  const major = v?.major ?? 0;
  const minor = v?.minor ?? 0;
  const micro = v?.micro ?? 0;
  return `${major}.${minor}.${micro}`;
}

function normalizeQualifier(q?: string | null) {
  return String(q ?? "")
    .trim()
    .replace(/[^0-9A-Za-z]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function fmtFull(v: ApiVersion | null | undefined) {
  const base = fmtRelease(v);
  const qualifier = normalizeQualifier(v?.qualifier);
  return qualifier ? `${base}.${qualifier}` : base;
}

function parseVersionObject(version: any): ApiVersion {
  return {
    major: Number(version?.major ?? version?.Major ?? 0),
    minor: Number(version?.minor ?? version?.Minor ?? 0),
    micro: Number(version?.micro ?? version?.Micro ?? 0),
    qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
  };
}

async function fetchJsonNoCache(params: { url: string; jwt: string | null }) {
  try {
    const res = await fetch(params.url, {
      method: "GET",
      cache: "no-store" as any,
      headers: params.jwt
        ? {
            Authorization: `Bearer ${params.jwt}`,
          }
        : undefined,
    });

    if (!res.ok) {
      return { __status: res.status };
    }

    return await res.json();
  } catch (err) {
    console.log("[UpdateBackendTab] Network error:", params.url, err);
    return null;
  }
}

function uniqById(list: ParsedComponent[]) {
  const seen = new Set<string>();
  const out: ParsedComponent[] = [];

  for (const item of list) {
    const id = String(item?.id ?? "").trim();
    if (!id) continue;
    if (seen.has(id)) continue;

    seen.add(id);
    out.push(item);
  }

  return out;
}

function parseSoftwareComponents(data: any): ParsedComponent[] {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list)) return [];

  const parsed = list.map((x: any, idx: number) => {
    const version = x?.version ?? x?.Version;

    const parsedVersion =
      version && typeof version === "object"
        ? parseVersionObject(version)
        : { major: 0, minor: 0, micro: 0, qualifier: "" };

    return {
      id: String(x?.ID ?? x?.id ?? x?.Id ?? `${idx}`),
      name: String(x?.name ?? x?.Name ?? "-"),
      type: String(x?.componentType ?? x?.ComponentType ?? x?.type ?? "-"),
      version: parsedVersion,
      raw: x,
    };
  });

  return uniqById(parsed);
}

function includesCI(haystack: string, needle: string) {
  const h = String(haystack ?? "").toLowerCase();
  const n = String(needle ?? "").toLowerCase().trim();

  if (!n) return true;

  return h.includes(n);
}

function pickTopNWithSelected<T extends { id: string }>(
  all: T[],
  selectedId: string,
  n: number,
): T[] {
  const picked = all.slice(0, n);

  if (!selectedId) return picked;

  const alreadyIn = picked.some((x) => x.id === selectedId);
  if (alreadyIn) return picked;

  const selected = all.find((x) => x.id === selectedId);
  if (!selected) return picked;

  return [selected, ...picked].slice(0, n);
}

function RowLabelValue(props: { label: string; value: string }) {
  return (
    <View style={s.statusRow}>
      <ThemedText style={s.statusLabel}>{props.label}</ThemedText>
      <ThemedText style={s.statusValue}>{props.value || "-"}</ThemedText>
    </View>
  );
}

export function UpdateBackendTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const updateState = useAppSelector((state) => state.update);

  const ip = api.ip;
  const jwt = api.jwt;

  const featureIntervalRef = useRef<any>(null);
  const fakeProgressRef = useRef<any>(null);
  const reconnectTimerRef = useRef<any>(null);

  const [features, setFeatures] = useState<ParsedComponent[]>([]);
  const [bundles, setBundles] = useState<ParsedComponent[]>([]);
  const [featureQuery] = useState<string>("");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");

  const [listStatus, setListStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const [showBackendUpdateDialog, setShowBackendUpdateDialog] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testStatusText, setTestStatusText] = useState("");
  const [updatePhase, setUpdatePhase] =
    useState<BackendUpdatePhase>("installing");

  const clearUpdateTimers = useCallback(() => {
    if (fakeProgressRef.current) {
      clearInterval(fakeProgressRef.current);
      fakeProgressRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const autoLogoutAfterBackendUpdate = useCallback(async () => {
    setLogoutFlowActive(true);

    try {
      setUpdatePhase("logout");
      setTestProgress(100);
      setTestStatusText(
        "Update abgeschlossen. Anmeldung wird zurückgesetzt...",
      );

      await dispatch(logoutAsync()).unwrap();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("[BACKEND UPDATE] Logout failed", err);
    } finally {
      setLogoutFlowActive(false);
    }
  }, [dispatch]);

  const startFakeBackendProgress = useCallback(() => {
    if (fakeProgressRef.current) {
      clearInterval(fakeProgressRef.current);
    }

    setTestProgress(0);

    fakeProgressRef.current = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 95) {
          return 95;
        }

        const next = prev + 4;

        if (next < 55) {
          setUpdatePhase("installing");
          setTestStatusText("Backend-Update wird installiert...");
        } else if (next < 85) {
          setUpdatePhase("restarting");
          setTestStatusText("Server wird neu gestartet...");
        } else {
          setUpdatePhase("reconnecting");
          setTestStatusText("Verbindung wird wiederhergestellt...");
        }

        return Math.min(next, 95);
      });
    }, 600);
  }, []);

  const resetLists = useCallback(() => {
    setFeatures([]);
    setBundles([]);
    setSelectedFeatureId("");
    setSelectedBundleId("");
  }, []);

  const loadFeaturesAndBundles = useCallback(
    async (override?: LoadOptions) => {
      if (!ip) {
        resetLists();
        setListStatus("-");
        return;
      }

      const effectiveFeatureId = override?.featureId ?? selectedFeatureId;

      setIsChecking(true);

      try {
        const q1 = new URLSearchParams();
        q1.set("_ts", String(Date.now()));
        q1.set("type", "FEATURE");

        const urlFeatures = joinUrl(
          ip,
          `${API_PREFIX}/version?${q1.toString()}`,
        );

        const dataFeatures = await fetchJsonNoCache({
          url: urlFeatures,
          jwt,
        });

        if (dataFeatures === null) {
          setListStatus(
            t("serverWeb.statusTexts.networkError", "Network error"),
          );
          resetLists();
          return;
        }

        if ((dataFeatures as any)?.__status) {
          const st = Number((dataFeatures as any).__status);

          setListStatus(
            st === 401
              ? t("serverWeb.statusTexts.unauthorized", "401 (Unauthorized)")
              : t("serverWeb.statusTexts.httpError", {
                  status: st,
                  defaultValue: `HTTP ${st}`,
                }),
          );

          resetLists();
          return;
        }

        const parsedFeatures = parseSoftwareComponents(dataFeatures).filter(
          (x) => String(x.type).toUpperCase() === "FEATURE",
        );

        setFeatures(parsedFeatures);

        const nextFeatureId =
          effectiveFeatureId &&
          parsedFeatures.some((x) => x.id === effectiveFeatureId)
            ? effectiveFeatureId
            : parsedFeatures[0]?.id ?? "";

        setSelectedFeatureId(nextFeatureId);

        const bundleType = nextFeatureId ? "BUNDLE_OF_FEATURE" : "BUNDLE";

        const q2 = new URLSearchParams();
        q2.set("_ts", String(Date.now()));
        q2.set("type", bundleType);

        if (bundleType === "BUNDLE_OF_FEATURE") {
          q2.set("filter", nextFeatureId);
        }

        const urlBundles = joinUrl(
          ip,
          `${API_PREFIX}/version?${q2.toString()}`,
        );

        const dataBundles = await fetchJsonNoCache({
          url: urlBundles,
          jwt,
        });

        if (dataBundles === null) {
          setListStatus(
            t("serverWeb.statusTexts.networkError", "Network error"),
          );
          setBundles([]);
          setSelectedBundleId("");
          return;
        }

        if ((dataBundles as any)?.__status) {
          const st = Number((dataBundles as any).__status);

          setListStatus(
            st === 401
              ? t("serverWeb.statusTexts.unauthorized", "401 (Unauthorized)")
              : t("serverWeb.statusTexts.httpError", {
                  status: st,
                  defaultValue: `HTTP ${st}`,
                }),
          );

          setBundles([]);
          setSelectedBundleId("");
          return;
        }

        const parsedBundles = parseSoftwareComponents(dataBundles);
        const onlyBundles = parsedBundles.filter(
          (x) => String(x.type).toUpperCase() === "BUNDLE",
        );

        setBundles(onlyBundles);

        setSelectedBundleId((prev) =>
          prev && onlyBundles.some((b) => b.id === prev)
            ? prev
            : onlyBundles[0]?.id ?? "",
        );

        setListStatus(t("serverWeb.statusTexts.upToDate", "Up to date"));
      } catch (err) {
        console.log("[UpdateBackendTab] loadFeaturesAndBundles error:", err);
        resetLists();
        setListStatus("-");
      } finally {
        setIsChecking(false);
      }
    },
    [ip, jwt, selectedFeatureId, t, resetLists],
  );

  const checkBackendNow = useCallback(async () => {
    if (!ip || isChecking) return;

    setIsChecking(true);

    try {
      await dispatch(checkBackendUpdate()).unwrap();

      await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      ).unwrap();
    } finally {
      setIsChecking(false);
    }
  }, [dispatch, ip, isChecking]);

  const installBackendUpdate = useCallback(async () => {
    if (!ip || isChecking) return;

    clearUpdateTimers();

    setIsChecking(true);
    setShowBackendUpdateDialog(true);
    setUpdatePhase("installing");
    setTestProgress(0);
    setTestStatusText("Backend-Update wird vorbereitet...");

    startFakeBackendProgress();

    let attempts = 0;
    const maxAttempts = 90;
    let minimumWaitAttempts = 0;

    const finishAndLogout = () => {
      clearUpdateTimers();

      setUpdatePhase("logout");
      setTestProgress(100);
      setTestStatusText(
        "Update abgeschlossen. Anmeldung wird zurückgesetzt...",
      );

      setTimeout(() => {
        void autoLogoutAfterBackendUpdate();
      }, 1200);
    };

    const waitForServer = async () => {
      attempts += 1;
      minimumWaitAttempts += 1;

      try {
        const reachable = await checkServerReachable(
          ip,
          jwt,
          authenticationMethod,
          { force: true },
        );

        if (reachable.ok && minimumWaitAttempts >= 3) {
          finishAndLogout();
          return;
        }

        if (!reachable.ok) {
          setUpdatePhase("restarting");
          setTestStatusText("Server wird neu gestartet...");
        } else {
          setUpdatePhase("reconnecting");
          setTestStatusText("Verbindung wird wiederhergestellt...");
        }
      } catch {
        setUpdatePhase("restarting");
        setTestStatusText("Server wird neu gestartet...");
      }

      if (attempts >= maxAttempts) {
        clearUpdateTimers();

        setUpdatePhase("reconnecting");
        setTestStatusText("Server konnte nicht wieder erreicht werden.");
        setIsChecking(false);
        return;
      }

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    };

    try {
      await dispatch(executeBackendUpdate()).unwrap();

      setUpdatePhase("restarting");
      setTestStatusText("Server wird neu gestartet...");

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    } catch (error) {
      console.warn(
        "[BACKEND UPDATE] Execute request failed, waiting for server restart...",
        error,
      );

      setUpdatePhase("restarting");
      setTestStatusText("Server wird neu gestartet...");

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    }
  }, [
    ip,
    jwt,
    authenticationMethod,
    isChecking,
    dispatch,
    clearUpdateTimers,
    startFakeBackendProgress,
    autoLogoutAfterBackendUpdate,
  ]);

  useEffect(() => {
    loadFeaturesAndBundles();

    dispatch(
      loadUpdateSettingsIfNeeded({
        force: false,
        maxAgeMs: 30 * 60 * 1000,
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    if (featureIntervalRef.current) {
      clearInterval(featureIntervalRef.current);
    }

    featureIntervalRef.current = setInterval(() => {
      loadFeaturesAndBundles();
    }, 5 * 60 * 1000);

    return () => {
      if (featureIntervalRef.current) {
        clearInterval(featureIntervalRef.current);
      }
    };
  }, [loadFeaturesAndBundles]);

  useEffect(() => {
    return () => {
      clearUpdateTimers();
    };
  }, [clearUpdateTimers]);

  const filteredFeatures = useMemo(() => {
    const q = featureQuery.trim();

    if (!q) return features;

    return features.filter(
      (f) =>
        includesCI(f.name, q) ||
        includesCI(f.id, q) ||
        includesCI(f.type, q),
    );
  }, [features, featureQuery]);

  const drawnFeatures = useMemo(() => {
    return pickTopNWithSelected(
      filteredFeatures,
      selectedFeatureId,
      MAX_FEATURES_DRAWN,
    );
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

  const backendStatus = updateState.backend.isAvailable
    ? t("serverWeb.statusTexts.updateAvailable", "Update available")
    : t("serverWeb.statusTexts.upToDate", "Up to date");

  return (
    <Card>
      <BackendUpdateProgressDialog
        visible={showBackendUpdateDialog}
        progress={testProgress}
        statusText={testStatusText}
        phase={updatePhase}
      />

      <View style={s.container}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <H3>{t("backend.title", "Backend")}</H3>
          </View>

          <View style={s.headerRight}>
            <View style={s.section}>
              <RowLabelValue
                label={t("backend.fields.lastCheck", "Letzte Prüfung")}
                value={updateState.backend.lastCheck || "-"}
              />

              <RowLabelValue
                label={t("backend.fields.status", "Status")}
                value={updateState.backend.status || backendStatus}
              />
            </View>
          </View>

          <View style={s.headerButtons}>
            <ActionButton
              label={
                isChecking
                  ? t("backend.actions.checking", "Suche nach Updates...")
                  : t("serverWeb.actions.checkNow", "Jetzt überprüfen")
              }
              variant="secondary"
              size="xs"
              onPress={checkBackendNow}
              disabled={isChecking || !ip || updateState.loading}
            />

            {updateState.backend.isAvailable && (
              <ActionButton
                label={t(
                  "backend.actions.executeUpdate",
                  "Update installieren",
                )}
                variant="primary"
                size="xs"
                onPress={installBackendUpdate}
                disabled={isChecking || updateState.loading || !ip}
              />
            )}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <ThemedText style={s.sectionTitle}>
              {t("InstalledFeatures", "Installed Features")}
            </ThemedText>

            <ThemedText style={s.helperText}>{listStatus}</ThemedText>
          </View>

          <SelectableList<string>
            items={featureItems}
            value={selectedFeatureId || (featureItems[0]?.id ?? "")}
            onChange={(id) => {
              setSelectedFeatureId(id);
              setSelectedBundleId("");
              loadFeaturesAndBundles({ featureId: id });
            }}
            maxHeight={140}
            minVisibleRows={5}
            size="xs0"
            variant="secondary"
            emptyText={t("backend.empty.noFeatures", "No features")}
          />
        </View>

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
            size="xs0"
            variant="secondary"
            emptyText={t("backend.empty.noBundles", "No bundles")}
          />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 14,
  },

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
    flexShrink: 0,
    minWidth: 170,
  },

  headerButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    flexBasis: "100%",
    justifyContent: "flex-start",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  statusLabel: {
    opacity: 0.85,
  },

  statusValue: {
    fontWeight: "700",
  },

  section: {
    gap: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  helperText: {
    fontSize: 12,
    opacity: 0.75,
  },
});