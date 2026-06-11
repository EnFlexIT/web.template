import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { selectApi, selectAuthenticationMethod } from "../redux/slices/apiSlice";
import {
  extractServerWebApp,
  fetchJsonNoCache,
  hardReloadWeb,
  joinUrl,
} from "./useUpdateNotifierWeb";
import { getServerScopedStorageKey } from "../redux/selectors/serverSelectors";
import { loadUpdateSettingsIfNeeded } from "../redux/slices/updateSlice";

const API_PREFIX = "/api";

const LAST_ACCEPTED_KEY_PREFIX =
  "appInfo_lastAcceptedServerWebAppVersionFull";

const POST_LOGIN_AUTO_RELOAD_SESSION_PREFIX =
  "postLoginAutoReloadChecked";

type Params = {
  enabled: boolean;
};

function getSessionCheckKey(ip: string) {
  return `${POST_LOGIN_AUTO_RELOAD_SESSION_PREFIX}::${ip}`;
}

export function usePostLoginAutoReloadWeb({ enabled }: Params) {
  const dispatch = useAppDispatch();

  const hasCheckedRef = useRef(false);
  const jwtRef = useRef<string | null>(null);

  const api = useAppSelector(selectApi);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

  const isWeb = Platform.OS === "web";
  const ip = api.ip;
  const jwt = api.jwt;
  const isLoggedIn = api.isLoggedIn;

  useEffect(() => {
    jwtRef.current = jwt;
  }, [jwt]);

  useEffect(() => {
    if (!isLoggedIn) {
      hasCheckedRef.current = false;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    async function run() {
      if (!enabled) return;
      if (!isWeb) return;
      if (!ip || !isLoggedIn) return;
      if (hasCheckedRef.current) return;

      const isOidc = authenticationMethod === "oidc";

      if (isOidc) return;

      const currentJwt = jwtRef.current;
      if (!currentJwt) return;

      const sessionCheckKey = getSessionCheckKey(ip);

      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(sessionCheckKey) === "true"
      ) {
        hasCheckedRef.current = true;
        return;
      }

      hasCheckedRef.current = true;

      const storageKey = getServerScopedStorageKey(
        LAST_ACCEPTED_KEY_PREFIX,
        ip,
      );

      const query = new URLSearchParams();
      query.set("_ts", String(Date.now()));

      const url = joinUrl(ip, `${API_PREFIX}/version?${query.toString()}`);

      const data = await fetchJsonNoCache({
        url,
        jwt: currentJwt,
      });

      if (data === null) {
        hasCheckedRef.current = false;
        return;
      }

      if ((data as any)?.__status) {
        hasCheckedRef.current = false;
        return;
      }

      const parsed = extractServerWebApp(data);

      if (!parsed) {
        hasCheckedRef.current = false;
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(sessionCheckKey, "true");
      }

      await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      );

      const accepted = (await AsyncStorage.getItem(storageKey)) ?? null;

      if (!accepted) {
        await AsyncStorage.setItem(storageKey, parsed.versionFull);
        return;
      }

      if (accepted !== parsed.versionFull) {
        await AsyncStorage.setItem(storageKey, parsed.versionFull);
        hardReloadWeb(parsed.versionFull);
      }
    }

    void run();
  }, [dispatch, enabled, authenticationMethod, ip, isLoggedIn, isWeb]);
}