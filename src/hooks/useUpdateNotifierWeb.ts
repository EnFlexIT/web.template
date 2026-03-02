import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppSelector } from "./useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";

const API_PREFIX = "/api";
const LAST_ACCEPTED_KEY = "update_lastAcceptedServerWebAppVersionFull"; // kannst du mit deinem Key matchen

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}
function joinUrl(base: string, path: string) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type ApiVersion = { major?: number; minor?: number; micro?: number; qualifier?: string };

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

function extractServerWebApp(data: any): { versionFull: string } | null {
  const list = data?.SoftwareComponentList ?? data?.softwareComponentList;
  if (!Array.isArray(list) || list.length === 0) return null;

  const item =
    list.find((x: any) => String(x?.componentType ?? "").toUpperCase() === "WEBAPP") ?? list[0];

  const version = item?.version ?? item?.Version;
  if (!version || typeof version !== "object") return null;

  const v: ApiVersion = {
    major: Number(version?.major ?? version?.Major ?? 0),
    minor: Number(version?.minor ?? version?.Minor ?? 0),
    micro: Number(version?.micro ?? version?.Micro ?? 0),
    qualifier: String(version?.qualifier ?? version?.Qualifier ?? ""),
  };

  return { versionFull: fmtFull(v) };
}

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

function hardReloadWeb(cacheKey: string) {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  u.searchParams.set("_v", cacheKey);
  u.searchParams.set("_ts", String(Date.now()));
  window.location.replace(u.toString());
}

export function useUpdateNotifierWeb(opts?: { intervalMs?: number }) {
  const intervalMs = opts?.intervalMs ?? 5 * 60 * 1000;

  const api = useAppSelector(selectApi);
  const ip = api.ip;
  const jwt = api.jwt;

  const isWeb = Platform.OS === "web";

  const timerRef = useRef<any>(null);

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentFull, setCurrentFull] = useState<string | null>(null);
  const [acceptedFull, setAcceptedFull] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("-");

  const checkNow = useCallback(async () => {
    if (!isWeb || !ip) return;

    const query = new URLSearchParams();
    query.set("_ts", String(Date.now()));

    const url = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);
    const data = await fetchJsonNoCache({ url, jwt });

    if (data === null) {
      setStatus("Network error");
      return;
    }
    if ((data as any)?.__status) {
      const st = Number((data as any).__status);
      setStatus(st === 401 ? "401 (Unauthorized)" : `HTTP ${st}`);
      return;
    }

    const parsed = extractServerWebApp(data);
    if (!parsed) {
      setStatus("Unexpected format");
      return;
    }

    setCurrentFull(parsed.versionFull);

    const accepted = (await AsyncStorage.getItem(LAST_ACCEPTED_KEY)) ?? null;
    if (!accepted) {
      // baseline setzen, kein Popup
      await AsyncStorage.setItem(LAST_ACCEPTED_KEY, parsed.versionFull);
      setAcceptedFull(parsed.versionFull);
      setUpdateAvailable(false);
      setStatus("OK (baseline stored)");
      return;
    }

    setAcceptedFull(accepted);

    if (accepted !== parsed.versionFull) {
      setUpdateAvailable(true);
      setStatus(`Update available: ${accepted} → ${parsed.versionFull}`);
      return;
    }

    setUpdateAvailable(false);
    setStatus("Up to date");
  }, [isWeb, ip, jwt]);

  const applyUpdateNow = useCallback(async () => {
    if (!isWeb) return;
    if (!currentFull) return;

    // Wichtig: erst speichern (gegen reload loop), dann reload
    await AsyncStorage.setItem(LAST_ACCEPTED_KEY, currentFull);
    hardReloadWeb(currentFull);
  }, [isWeb, currentFull]);

  useEffect(() => {
    if (!isWeb) return;

    // initial check
    checkNow();

    // interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => checkNow(), intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWeb, checkNow, intervalMs]);

  return {
    updateAvailable,
    status,
    acceptedFull,
    currentFull,
    checkNow,
    applyUpdateNow,
    canCheck: isWeb && !!ip,
  };
}