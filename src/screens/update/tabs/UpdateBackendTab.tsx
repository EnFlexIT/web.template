import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Infobox } from "../../../components/ui-elements/Infobox";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { selectApi } from "../../../redux/slices/apiSlice";
import { SelectableList, SelectableItem } from "../../../components/ui-elements/SelectableList";

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

type BackendType = "WEBAPP" | "FEATURE" | "BUNDLE" | "BUNDLE_OF_FEATURE";

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

function parseSoftwareComponents(data: any): ParsedComponent[] {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list)) return [];

  return list
    .map((x: any, idx: number) => {
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
    })
    .filter(Boolean);
}

export function UpdateBackendTab() {
  const { t } = useTranslation(["Settings.AppInfo"]);
  const api = useAppSelector(selectApi);

  const ip = api.ip;
  const jwt = api.jwt;

  const intervalRef = useRef<any>(null);

  const [type, setType] = useState<BackendType>("BUNDLE");
  const [isShowSource, setIsShowSource] = useState<boolean>(true);

  const [items, setItems] = useState<ParsedComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [lastCheckedAt, setLastCheckedAt] = useState<string>("-");
  const [status, setStatus] = useState<string>("-");
  const [isChecking, setIsChecking] = useState(false);

  const checkNow = useCallback(async () => {
    if (!ip) return;

    setIsChecking(true);
    setLastCheckedAt(new Date().toLocaleString());

    const query = new URLSearchParams();
    query.set("_ts", String(Date.now()));
    query.set("type", type);
    query.set("isShowSource", String(isShowSource));

    // optional: filter (z.B. für BUNDLE_OF_FEATURE)
    // query.set("filter", "someFeatureId");

    const url = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);
    const data = await fetchJsonNoCache({ url, jwt });

    // Network error
    if (data === null) {
      setStatus("Network error");
      setItems([]);
      setSelectedId("");
      setIsChecking(false);
      return;
    }

    // HTTP error
    if ((data as any)?.__status) {
      const st = Number((data as any).__status);
      setStatus(st === 401 ? "401 (Unauthorized)" : `HTTP ${st}`);
      setItems([]);
      setSelectedId("");
      setIsChecking(false);
      return;
    }

    const parsed = parseSoftwareComponents(data);
    if (!parsed.length) {
      setStatus("No components / unexpected format");
      setItems([]);
      setSelectedId("");
      setIsChecking(false);
      return;
    }

    setItems(parsed);
    setSelectedId((prev) => (prev && parsed.some((p) => p.id === prev) ? prev : parsed[0].id));
    setStatus("OK");
    setIsChecking(false);
  }, [ip, jwt, type, isShowSource]);

  // initial check
  useEffect(() => {
    checkNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // interval check (optional — erstmal minimal an/aus lassen)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      checkNow();
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkNow]);

  const typeItems = useMemo<SelectableItem<BackendType>[]>(() => {
    return [
      { id: "BUNDLE", label: "Bundles", },
      { id: "FEATURE", label: "Features",  },
      { id: "BUNDLE_OF_FEATURE", label: "Bundles of Feature",  },
      { id: "WEBAPP", label: "WebApp",  },
    ];
  }, []);

  const componentItems = useMemo<SelectableItem<string>[]>(() => {
    return items.map((c) => ({
      id: c.id,
      label: c.name,
    
    }));
  }, [items]);

  const selected = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId]);

  const box = (() => {
    if (!ip) {
      return {
        tone: "warning" as const,
        title: t("infobox.no_server.title", "Kein Server verbunden"),
        subtitle: t("infobox.no_server.subtitle", "Bitte zuerst eine Server-IP konfigurieren."),
      };
    }

    const s = String(status).toLowerCase();
    if (s.includes("unauthorized")) {
      return {
        tone: "warning" as const,
        title: "Version check not authorized",
        subtitle: "Server returned 401. Check JWT / permissions for /api/version.",
      };
    }
    if (s.includes("network")) {
      return { tone: "warning" as const, title: "Network issue", subtitle: "Backend version could not be checked." };
    }
    if (s.includes("http")) {
      return { tone: "warning" as const, title: "HTTP issue", subtitle: `Server returned: ${status}` };
    }
    if (s.includes("no components")) {
      return { tone: "warning" as const, title: "No data", subtitle: "Response contained no components (or format changed)." };
    }
    return { tone: "info" as const, title: "OK", subtitle: "Backend components loaded." };
  })();

  return (
   
    <Card>
     
      <View style={s.container}>
        <ThemedText style={s.title}>Backend</ThemedText>

        <View style={s.row}>
          {/* Left: type selector + component list */}
          <View style={s.col}>
            <ThemedText style={s.blockTitle}>Type</ThemedText>
            <SelectableList<BackendType>
              items={typeItems}
              value={type}
              onChange={(id) => setType(id)}
              maxHeight={180}
              minVisibleRows={3}
              size="sm"
              variant="secondary"
            />

            <View style={{ height: 12 }} />

            <ThemedText style={s.blockTitle}>Components</ThemedText>
            <SelectableList<string>
              items={componentItems}
              value={selectedId || (componentItems[0]?.id ?? "")}
              onChange={(id) => setSelectedId(id)}
              maxHeight={260}
              minVisibleRows={4}
              size="sm"
              variant="secondary"
              emptyText="No components"
            />
          </View>

          {/* Right: details */}
          <View style={s.col}>
            <ThemedText style={s.blockTitle}>Details</ThemedText>

            <View style={s.detailsBox}>
              <Row label="Last checked" value={lastCheckedAt} />
              <Row label="Status" value={status} />
              <Row label="Show source" value={String(isShowSource)} />
              <Row label="Selected" value={selected ? selected.name : "-"} />
              <Row label="Component type" value={selected ? selected.type : "-"} />
              <Row label="Version (Release)" value={selected ? fmtRelease(selected.version) : "-"} />
              <Row label="Version (Full)" value={selected ? fmtFull(selected.version) : "-"} />
            </View>

            <View style={s.btnRow}>
              <ActionButton
                label={isChecking ? "Prüfe…" : "Jetzt überprüfen"}
                variant="secondary"
                size="xs"
                onPress={checkNow}
                disabled={isChecking || !ip}
              />

              {/* Minimal Toggle für isShowSource (ohne extra UI Element) */}
              <ActionButton
                label={isShowSource ? "Source: ON" : "Source: OFF"}
                variant="secondary"
                size="xs"
                onPress={() => setIsShowSource((v) => !v)}
                disabled={isChecking}
              />
            </View>

            <Infobox tone={box.tone} title={box.title} subtitle={box.subtitle} style={s.fixedBox} />
          </View>
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
  container: { gap: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  blockTitle: { fontSize: 13, fontWeight: "700", opacity: 0.85, marginBottom: 6 },

  row: { flexDirection: "row", gap: 16 },
  col: { flex: 1, gap: 8 },
  scrollContent: {
    paddingBottom: 18, // damit unten nichts abgeschnitten wirkt
  },


  detailsBox: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    padding: 12,
    gap: 8,
  },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: { fontSize: 12, opacity: 0.75, flex: 1 },
  value: { fontSize: 13, fontWeight: "600" },

  btnRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 4 },
  fixedBox: { minHeight: 120, marginTop: 8 },
});