import { useEffect } from "react";
import { useAppDispatch } from "@/template/state/store/useAppDispatch";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import { fetchGroupRoles } from "./fetchGroupRoles";

export function useGroupRolesSync({
  enabled,
}: {
  enabled: boolean;
}): void {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(
    state => state.api.isLoggedIn
  );
  const isPointingToServer = useAppSelector(
    state => state.api.isPointingToServer
  );
  const isSwitchingServer = useAppSelector(
    state => state.api.isSwitchingServer
  );
  const isLoggingOut = useAppSelector(
    state => state.api.isLoggingOut
  );
  const status = useAppSelector(
    state => state.groupRoles.status
  );

  useEffect(() => {
    if (
      !enabled ||
      !isLoggedIn ||
      !isPointingToServer ||
      isSwitchingServer ||
      isLoggingOut ||
      status !== "idle"
    ) {
      return;
    }

    void dispatch(fetchGroupRoles());
  }, [
    dispatch,
    enabled,
    isLoggedIn,
    isPointingToServer,
    isSwitchingServer,
    isLoggingOut,
    status,
  ]);
}
