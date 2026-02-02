import React, { ReactNode, useEffect, useState } from "react";
import { Screen } from "../components/Screen";
import { LoadingScreen } from "./LoadingScreen";
import { SiteContentList } from "../components/dynamic/content/SiteContentList";
import { MenuItem } from "../redux/slices/menuSlice";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi, selectIsLoggedIn, selectJwt } from "../redux/slices/apiSlice";
import { ThemedText } from "../components/themed/ThemedText";
import { selectBaseMode } from "../redux/slices/baseModeSlice";

//  Feature-Flag Check
import { isMenuEnabled } from "../redux/slices/featureFlags";

interface DynamicScreenProps {
  node: MenuItem;
}

export function DynamicScreen({ node }: DynamicScreenProps) {
  const { dynamic_content_api } = useAppSelector(selectApi);

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const jwt = useAppSelector(selectJwt);

  // falls BaseMode separat :
  const { baseModeLoggedIn } = useAppSelector(selectBaseMode);

  // ROUTE-GATE: wenn feature disabled → sofort stoppen
  const enabled = isMenuEnabled(node.menuID);

  // nur laden, wenn wirklich autorisiert
  const canLoad = Boolean(jwt) && (isLoggedIn || baseModeLoggedIn);

  const [element, setElement] = useState<ReactNode>(undefined);

  useEffect(() => {
    let alive = true;

    //wenn disabled, gar nicht erst laden
    if (!enabled) {
      setElement(
        <ThemedText>
          Dieser Bereich ist aktuell in Bearbeitung und daher vorübergehend nicht verfügbar.
        </ThemedText>
      );
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        if (!canLoad) {
          if (alive) {
            setElement(
              <ThemedText>
                Nicht angemeldet – Dynamic Content kann nicht geladen werden.
              </ThemedText>
            );
          }
          return;
        }

        // liefert content unter -1, -2... => menuID umdrehen
        const res = await dynamic_content_api.defaultApi.contentMenuIDGet(
          -node.menuID!
        );

        if (!alive) return;

        setElement(<SiteContentList siteContentList={res.data} />);
      } catch (e: any) {
        if (!alive) return;

        const status = e?.response?.status ?? e?.status;

        if (status === 401) {
          setElement(
            <ThemedText>
              401 Unauthorized – bitte neu einloggen oder Base-Login prüfen.
            </ThemedText>
          );
          return;
        }

        setElement(
          <ThemedText>
            Fehler beim Laden des Inhalts: {String(e?.message ?? e)}
          </ThemedText>
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled, canLoad, dynamic_content_api, node.menuID]);

  return element ? <Screen>{element}</Screen> : <LoadingScreen />;
}
