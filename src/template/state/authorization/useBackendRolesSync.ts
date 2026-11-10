import { useEffect } from "react";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import { fetchBackendRoles } from "./fetchBackendRoles";

type UseBackendRolesSyncOptions = {
  enabled: boolean;
};

export function useBackendRolesSync({
  enabled,
}: UseBackendRolesSyncOptions): void {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(
    (state) => state.api.isLoggedIn,
  );

  const isSwitchingServer = useAppSelector(
    (state) => state.api.isSwitchingServer,
  );
  const isLoggingOut = useAppSelector(
    (state) => state.api.isLoggingOut,
  );

  const status = useAppSelector(
    (state) => state.backendRoles.status,
  );

  useEffect(() => {
    if (
      !enabled ||
      !isLoggedIn ||
      isSwitchingServer ||
      isLoggingOut ||
      status !== "idle"
    ) {
      return;
    }

    void dispatch(fetchBackendRoles());
  }, [
    dispatch,
    enabled,
    isLoggedIn,
    isSwitchingServer,
    isLoggingOut,
    status,
  ]);
}