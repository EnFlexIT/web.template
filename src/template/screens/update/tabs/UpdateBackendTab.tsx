import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../../hooks/useAppSelector";

import {
  logoutAsync,
  selectApi,
  selectAuthenticationMethod,
} from "../../../../redux/slices/apiSlice";

import { setLogoutFlowActive } from "../../../../core/authentication/logout/logoutFlowGuard";

import {
  checkBackendUpdate,
  executeBackendUpdate,
} from "../../../../core/update/redux/updateSlice";

import { checkServerReachable } from "../../../../core/server/serverCheck";

import {
  UpdateProgressDialog,
  UpdateProgressPhase,
} from "../../../../components/ui-elements/UpdateProgressDialog";
import { Card } from "../../../../components/ui-elements/Card";
import { ActionButton } from "../../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../../components/themed/ThemedText";
import {
  SelectableItem,
  SelectableList,
} from "../../../../components/ui-elements/SelectableList";
import { H3 } from "../../../../components/stylistic/H3";

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

function isRedirectStatus(status?: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

async function fetchJsonNoCache(params: {
  url: string;
  jwt: string | null;
  authenticationMethod: string;
}) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (params.authenticationMethod === "jwt" && params.jwt) {
      headers.Authorization = `Bearer ${params.jwt}`;
    }

    const res = await fetch(params.url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      redirect: "manual",
      headers,
    });

    if (isRedirectStatus(res.status) || res.type === "opaqueredirect") {
      return {
        __status: res.status || 303,
        __redirect: true,
      };
    }

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

function InfoRow(props: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <ThemedText style={s.infoLabel}>{props.label}</ThemedText>
      <ThemedText style={s.infoValue}>{props.value || "-"}</ThemedText>
    </View>
  );
}

export function UpdateBackendTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();

  const api = useAppSelector(selectApi);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const updateState = useAppSelector((state) => state.update);

  const ip = api.ip;
  const jwt = api.jwt;

  const reconnectTimerRef = useRef<any>(null);

  const [features, setFeatures] = useState<ParsedComponent[]>([]);
  const [bundles, setBundles] = useState<ParsedComponent[]>([]);
  const [featureQuery] = useState<string>("");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");

  const [listStatus, setListStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const [showBackendUpdateDialog, setShowBackendUpdateDialog] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [updatePhase, setUpdatePhase] = useState<UpdateProgressPhase>("installing");

  const clearUpdateTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const autoLogoutAfterBackendUpdate = useCallback(async () => {
    setLogoutFlowActive(true);

    try {
      setUpdatePhase("logout");
      setStatusText(
        t(
          "backend.updateDialog.steps.logout",
          "Anmeldung wird zurückgesetzt...",
        ),
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
  }, [dispatch, t]);

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
          authenticationMethod,
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
            (dataFeatures as any).__redirect
              ? t("serverWeb.statusTexts.unauthorized", "OIDC redirect")
              : st === 401
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
          authenticationMethod,
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
            (dataBundles as any).__redirect
              ? t("serverWeb.statusTexts.unauthorized", "OIDC redirect")
              : st === 401
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
    [
      ip,
      jwt,
      authenticationMethod,
      selectedFeatureId,
      t,
      resetLists,
    ],
  );

  const checkBackendNow = useCallback(async () => {
    if (!ip || isChecking) return;

    setIsChecking(true);

    try {
      await dispatch(
        checkBackendUpdate(),
      ).unwrap();

      await loadFeaturesAndBundles();
    } finally {
      setIsChecking(false);
    }
  }, [dispatch, ip, isChecking, loadFeaturesAndBundles]);

  const installBackendUpdate = useCallback(async () => {
    if (!ip || isChecking) return;

    clearUpdateTimers();

    setIsChecking(true);
    setShowBackendUpdateDialog(true);
    setUpdatePhase("installing");
    setStatusText(
      t(
        "backend.updateDialog.steps.installing",
        "Backend-Update wird installiert...",
      ),
    );

    let attempts = 0;
    const maxAttempts = 90;
    let minimumWaitAttempts = 0;

    const finishAndLogout = () => {
      clearUpdateTimers();

      setUpdatePhase("logout");
      setStatusText(
        t(
          "backend.updateDialog.steps.logout",
          "Anmeldung wird zurückgesetzt...",
        ),
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
          setStatusText(
            t(
              "backend.updateDialog.steps.restarting",
              "Server wird neu gestartet...",
            ),
          );
        } else {
          setUpdatePhase("reconnecting");
          setStatusText(
            t(
              "backend.updateDialog.steps.reconnecting",
              "Verbindung wird wiederhergestellt...",
            ),
          );
        }
      } catch {
        setUpdatePhase("restarting");
        setStatusText(
          t(
            "backend.updateDialog.steps.restarting",
            "Server wird neu gestartet...",
          ),
        );
      }

      if (attempts >= maxAttempts) {
        clearUpdateTimers();

        setUpdatePhase("error");
        setStatusText(
          t(
            "backend.updateDialog.steps.failedReconnect",
            "Server konnte nicht wieder erreicht werden.",
          ),
        );
        setIsChecking(false);
        return;
      }

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    };

    try {
      await dispatch(executeBackendUpdate()).unwrap();

      setUpdatePhase("restarting");
      setStatusText(
        t(
          "backend.updateDialog.steps.restarting",
          "Server wird neu gestartet...",
        ),
      );

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    } catch (error) {
      console.warn(
        "[BACKEND UPDATE] Execute request failed, waiting for server restart...",
        error,
      );

      setUpdatePhase("restarting");
      setStatusText(
        t(
          "backend.updateDialog.steps.restarting",
          "Server wird neu gestartet...",
        ),
      );

      reconnectTimerRef.current = setTimeout(waitForServer, 2000);
    }
  }, [
    ip,
    jwt,
    authenticationMethod,
    isChecking,
    dispatch,
    clearUpdateTimers,
    autoLogoutAfterBackendUpdate,
    t,
  ]);

  useEffect(() => {
    /*
     * Lädt nur die installierten Features und Bundles.
     * Der Update-Check wird zentral durch den Post-Login-
     * beziehungsweise Notification-Watcher ausgeführt.
     */
    void loadFeaturesAndBundles();
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

  const backendStatus =
    updateState.backend.isPending
      ? t(
          "backend.statusTexts.checking",
          "Suche nach Updates...",
        )
      : updateState.backend.isAvailable
        ? t(
            "serverWeb.statusTexts.updateAvailable",
            "Update verfügbar",
          )
        : updateState.backend.lastCheck
          ? t(
              "serverWeb.statusTexts.upToDate",
              "Aktuell",
            )
          : t(
              "backend.statusTexts.notChecked",
              "Noch nicht geprüft",
            );

  return (
    <Card>
    <UpdateProgressDialog
  visible={showBackendUpdateDialog}
  statusText={statusText}
  phase={updatePhase}
/>

      <View style={{ backgroundColor: theme.colors.card, padding: 12, gap: 14 }}>
        <H3>{t("backend.title", "Backend")}</H3>

        <View style={s.infoTable}>
          <InfoRow
            label={t("backend.fields.status", "Status")}
            value={backendStatus}
          />

          <InfoRow
            label={t("backend.fields.lastCheck", "Letzte Prüfung")}
            value={updateState.backend.lastCheck || "-"}
          />

          <InfoRow
            label={t("backend.fields.backendStatus", "Backend-Status")}
            value={updateState.backend.status || "-"}
          />
        </View>

        <View style={s.buttonRow}>
          {!updateState.autoUpdate ? (
            <ActionButton
              label={
                isChecking
                  ? t(
                      "backend.actions.checking",
                      "Suche nach Updates...",
                    )
                  : t(
                      "backend.actions.checkNow",
                      "Nach Updates suchen",
                    )
              }
              variant="secondary"
              size="xs"
              onPress={checkBackendNow}
              disabled={
                isChecking ||
                !ip ||
                updateState.loading
              }
            />
          ) : null}

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
              void loadFeaturesAndBundles({ featureId: id });
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
  infoTable: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    gap: 12,
  },

  infoLabel: {
    fontSize: 12,
    opacity: 0.75,
    flex: 1,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },

  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
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