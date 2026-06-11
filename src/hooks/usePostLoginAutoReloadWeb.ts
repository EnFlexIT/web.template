import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { selectApi, selectAuthenticationMethod } from "../redux/slices/apiSlice";
import {
  executeFrontendUpdate,
  loadUpdateSettingsIfNeeded,
} from "../redux/slices/updateSlice";

type Params = {
  enabled: boolean;
};

function isTrue(value: any) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

export function usePostLoginAutoReloadWeb({ enabled }: Params) {
  const dispatch = useAppDispatch();

  const hasCheckedRef = useRef(false);

  const api = useAppSelector(selectApi);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

  const isWeb = Platform.OS === "web";
  const ip = api.ip;
  const isLoggedIn = api.isLoggedIn;

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
      if (authenticationMethod === "oidc") return;

      hasCheckedRef.current = true;

      const result = await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      ).unwrap();

      if (!result) return;

      const autoUpdate = isTrue(result.autoUpdate);
      const frontendUpdateAvailable = isTrue(
        result.frontend?.isAvailable,
      );

      console.log("[POST LOGIN UPDATE]", {
        autoUpdate,
        frontendUpdateAvailable,
        result,
      });

      if (!autoUpdate || !frontendUpdateAvailable) return;

      await dispatch(executeFrontendUpdate()).unwrap();

      await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      ).unwrap();

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }

    void run();
  }, [dispatch, enabled, authenticationMethod, ip, isLoggedIn, isWeb]);
}