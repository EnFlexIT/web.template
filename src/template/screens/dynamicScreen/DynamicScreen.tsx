import React, {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
  Screen,
} from "@/template/components/layout/Screen";

import {
  LoadingScreen,
} from "../loading/LoadingScreen";

import {
  SiteContentList,
} from "@/template/components/dynamic-content/content/SiteContentList";

import type {
  MenuItem,
} from "@/template/state/navigation/menuSlice";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectApi,
  selectAuthenticationMethod,
  selectIsLoggedIn,
  selectJwt,
} from "@/template/state/api/apiSlice";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  selectBaseMode,
} from "@/template/state/mode/baseModeSlice";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

interface DynamicScreenProps {
  node: MenuItem;
}

export function DynamicScreen({
  node,
}: DynamicScreenProps) {
  const {
    dynamic_content_api,
  } = useAppSelector(
    selectApi,
  );

  const isLoggedIn =
    useAppSelector(
      selectIsLoggedIn,
    );

  const jwt =
    useAppSelector(
      selectJwt,
    );

  const authenticationMethod =
    useAppSelector(
      selectAuthenticationMethod,
    );

  const {
    baseModeLoggedIn,
  } = useAppSelector(
    selectBaseMode,
  );

  const {
    menu: menuConfiguration,
  } = getNavigationRuntime();

  const enabled =
    menuConfiguration.isEnabled(
      node.menuID,
      {
        authenticationMethod,
      },
    );

  const canLoad =
    Boolean(jwt) &&
    (
      isLoggedIn ||
      baseModeLoggedIn
    );

  const [
    element,
    setElement,
  ] = useState<
    ReactNode
  >(undefined);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setElement(
        <ThemedText>
          Dieser Bereich ist
          aktuell in Bearbeitung
          und daher vorübergehend
          nicht verfügbar.
        </ThemedText>,
      );

      return () => {
        alive = false;
      };
    }

    const loadContent =
      async () => {
        try {
          if (!canLoad) {
            if (alive) {
              setElement(
                <ThemedText>
                  Nicht angemeldet –
                  Dynamic Content kann
                  nicht geladen werden.
                </ThemedText>,
              );
            }

            return;
          }

          const response =
            await dynamic_content_api
              .defaultApi
              .contentMenuIDGet(
                -node.menuID,
              );

          if (!alive) {
            return;
          }

          setElement(
            <SiteContentList
              siteContentList={
                response.data
              }
            />,
          );
        } catch (
          error: any
        ) {
          if (!alive) {
            return;
          }

          const status =
            error?.response
              ?.status ??
            error?.status;

          if (
            status === 401
          ) {
            setElement(
              <ThemedText>
                401 Unauthorized –
                bitte neu einloggen
                oder Base-Login
                prüfen.
              </ThemedText>,
            );

            return;
          }

          setElement(
            <ThemedText>
              Fehler beim Laden
              des Inhalts:{" "}
              {String(
                error?.message ??
                  error,
              )}
            </ThemedText>,
          );
        }
      };

    void loadContent();

    return () => {
      alive = false;
    };
  }, [
    enabled,
    canLoad,
    dynamic_content_api,
    node.menuID,
  ]);

  return element ? (
    <Screen>
      {element}
    </Screen>
  ) : (
    <LoadingScreen />
  );
}