import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";
import { H3 } from "../../../components/stylistic/H3";

import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";

import { selectApi } from "../../../redux/slices/apiSlice";

import {
  checkFrontendUpdate,
  clearUpdateSettingsCache,
  executeFrontendUpdate,
} from "../../../redux/slices/updateSlice";

import {
  UpdateProgressDialog,
  type UpdateProgressPhase,
} from "../Dialog/UpdateProgressDialog";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * Lädt die aktuelle Web-App neu, ohne die bestehende
 * JWT- oder OIDC-Sitzung zurückzusetzen.
 *
 * Der Zeitstempel verhindert, dass index.html aus einem
 * veralteten Browser-Cache geladen wird.
 */
function reloadCurrentWebApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const targetUrl = new URL(window.location.href);

  targetUrl.searchParams.set(
    "updated",
    String(Date.now()),
  );

  window.location.replace(
    targetUrl.toString(),
  );

  return true;
}

export function UpdateWebAppTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);

  const updateState = useAppSelector(
    (state) => state.update,
  );

  const ip = api.ip;

  const checkRequestActiveRef = useRef(false);
  const installRequestActiveRef = useRef(false);

  const [isChecking, setIsChecking] =
    useState(false);

  const [isInstalling, setIsInstalling] =
    useState(false);

  const [
    showUpdateDialog,
    setShowUpdateDialog,
  ] = useState(false);

  const [statusText, setStatusText] =
    useState("");

  const [updatePhase, setUpdatePhase] =
    useState<UpdateProgressPhase>("installing");

  /**
   * Beim Öffnen des Tabs wird ausschließlich der
   * Frontend-Update-Status geprüft.
   *
   * checkFrontendUpdate lädt parallel auch die tatsächlich
   * installierte Version über:
   *
   * GET /api/version?type=WEBAPP
   */
      useEffect(() => {
        if (!ip || updateState.autoUpdate) {
          return;
        }

        void dispatch(checkFrontendUpdate())
          .unwrap()
          .catch((error) => {
            console.warn(
              "[FRONTEND UPDATE] Initial update check failed",
              error,
            );
          });
      }, [
        dispatch,
        ip,
        updateState.autoUpdate,
      ]);

  const checkNow = useCallback(async () => {
    if (
      !ip ||
      checkRequestActiveRef.current ||
      installRequestActiveRef.current
    ) {
      return;
    }

    checkRequestActiveRef.current = true;
    setIsChecking(true);

    try {
      /**
       * Keine künstliche Wartezeit.
       *
       * Der Button bleibt so lange deaktiviert, bis der echte
       * Server-Request abgeschlossen oder fehlgeschlagen ist.
       */
      await dispatch(
        checkFrontendUpdate(),
      ).unwrap();
    } catch (error) {
      console.warn(
        "[FRONTEND UPDATE] Update check failed",
        error,
      );
    } finally {
      checkRequestActiveRef.current = false;
      setIsChecking(false);
    }
  }, [dispatch, ip]);

  const installFrontendUpdate =
    useCallback(async () => {
      if (
        !ip ||
        installRequestActiveRef.current ||
        checkRequestActiveRef.current
      ) {
        return;
      }

      installRequestActiveRef.current = true;

      setIsInstalling(true);
      setShowUpdateDialog(true);
      setUpdatePhase("installing");

      setStatusText(
        t(
          "serverWeb.updateDialog.steps.installing",
          "Die neue Version der Web-App wird installiert…",
        ),
      );

      try {
        /**
         * UPDATE.FRONTEND.EXECUTE wird genau einmal ausgeführt.
         *
         * Der Request wird vollständig abgewartet. Dadurch wird
         * verhindert, dass der Browser den Request während der
         * eigentlichen Installation abbricht.
         */
        await dispatch(
          executeFrontendUpdate(),
        ).unwrap();

        clearUpdateSettingsCache();

        setUpdatePhase("success");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.success",
            "Das Frontend-Update wurde erfolgreich installiert.",
          ),
        );

        /**
         * Nur eine kurze UI-Übergangszeit.
         * Das ist keine Update-Polling-Schleife.
         */
        await wait(350);

        setUpdatePhase("restarting");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.restarting",
            "Die Web-App wird neu geladen. Deine Anmeldung bleibt erhalten.",
          ),
        );

        await wait(250);

        const reloadStarted =
          reloadCurrentWebApp();

        /**
         * Dieser Fall betrifft nur Nicht-Web-Runtimes.
         * Im Browser wird die aktuelle Seite jetzt ersetzt.
         */
        if (!reloadStarted) {
          installRequestActiveRef.current = false;

          setIsInstalling(false);
          setShowUpdateDialog(false);
        }
      } catch (error) {
        console.error(
          "[FRONTEND UPDATE] Update failed",
          error,
        );

        installRequestActiveRef.current = false;
        setIsInstalling(false);

        setUpdatePhase("error");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.failed",
            "Das Frontend-Update konnte nicht installiert werden. Bitte versuche es erneut.",
          ),
        );
      }
    }, [dispatch, ip, t]);

  const closeErrorDialog =
    useCallback(() => {
      if (updatePhase !== "error") {
        return;
      }

      installRequestActiveRef.current = false;

      setShowUpdateDialog(false);
      setIsInstalling(false);
    }, [updatePhase]);

  const availableVersion =
    updateState.frontend.newVersion ||
    updateState.frontend.version ||
    "-";

  const updateStatus =
    isInstalling ||
    updateState.frontend.isPending
      ? t(
          "serverWeb.statusTexts.installing",
          "Update wird verarbeitet",
        )
      : updateState.frontend.isAvailable
        ? t(
            "serverWeb.statusTexts.updateAvailable",
            {
              version: availableVersion,
              defaultValue:
                "Neues Update verfügbar",
            },
          )
        : t(
            "serverWeb.statusTexts.upToDate",
            "Aktuell",
          );

  /**
   * Die installierte Version kommt ausschließlich von:
   * GET /api/version?type=WEBAPP
   */
  const currentVersion =
    updateState.frontend.currentVersion ||
    "-";

  const newVersion =
    updateState.frontend.isAvailable
      ? availableVersion
      : "-";

  const lastCheckedAt =
    updateState.frontend.lastCheck ||
    "-";

  const controlsDisabled =
    isChecking ||
    isInstalling ||
    !ip;

  return (
    <Card>
      <UpdateProgressDialog
        visible={showUpdateDialog}
        statusText={statusText}
        phase={updatePhase}
        onClose={closeErrorDialog}
      />

      <View style={s.container}>
        <H3>
          {t(
            "serverWeb.title",
            "Web-App",
          )}
        </H3>

        <Row
          label={t(
            "serverWeb.fields.acceptedVersion",
            "Version",
          )}
          value={currentVersion}
        />

        <Row
          label={t(
            "serverWeb.fields.newVersion",
            "Neue Version",
          )}
          value={newVersion}
        />

        <Row
          label={t(
            "serverWeb.fields.status",
            "Update-Status",
          )}
          value={updateStatus}
        />

        <Row
          label={t(
            "serverWeb.fields.lastCheck",
            "Letzte Prüfung",
          )}
          value={lastCheckedAt}
        />

       <View style={s.btnRow}>
  {!updateState.autoUpdate ? (
    <ActionButton
      label={
        isChecking
          ? t(
              "serverWeb.actions.checking",
              "Prüfe…",
            )
          : t(
              "serverWeb.actions.checkNow",
              "Nach Updates suchen",
            )
      }
      variant="secondary"
      size="xs"
      onPress={checkNow}
      disabled={controlsDisabled}
    />
  ) : null}

  {updateState.frontend.isAvailable ? (
    <ActionButton
      label={
        isInstalling
          ? t(
              "serverWeb.actions.installing",
              "Update wird installiert…",
            )
          : t(
              "serverWeb.actions.executeUpdate",
              "Update installieren",
            )
      }
      variant="primary"
      size="xs"
      onPress={installFrontendUpdate}
      disabled={controlsDisabled}
    />
  ) : null}
</View>
      </View>
    </Card>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.rowLine}>
      <ThemedText style={s.label}>
        {label}
      </ThemedText>

      <ThemedText style={s.value}>
        {value || "-"}
      </ThemedText>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 14,
  },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  label: {
    fontSize: 12,
    opacity: 0.75,
    flex: 1,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
  },

  btnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
});