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

import {
  logoutAsync,
  selectApi,
} from "../../../redux/slices/apiSlice";

import { setLogoutFlowActive } from "../../../redux/slices/logoutFlowGuard";

import {
  checkFrontendUpdate,
  clearUpdateSettingsCache,
  executeFrontendUpdate,
} from "../../../redux/slices/updateSlice";

import {
  UpdateProgressDialog,
  UpdateProgressPhase,
} from "../Dialog/UpdateProgressDialog";

const MAX_CHECK_WAIT_MS = 1000;
const MAX_EXECUTE_WAIT_MS = 1000;
const MAX_LOGOUT_WAIT_MS = 1000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitAtMost<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T | undefined> {
  return Promise.race([
    promise,
    wait(milliseconds).then(() => undefined),
  ]);
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

  /*
   * Beim Öffnen des Tabs wird nur der Frontend-Status geladen.
   *
   * loadUpdateSettingsIfNeeded wurde hier entfernt, weil diese
   * Funktion zusätzlich Strategie- und Backend-Daten lädt.
   */
  useEffect(() => {
    void dispatch(checkFrontendUpdate());
  }, [dispatch]);

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

    const request = dispatch(
      checkFrontendUpdate(),
    )
      .unwrap()
      .catch((error) => {
        console.warn(
          "[FRONTEND UPDATE] Update check failed",
          error,
        );

        return undefined;
      })
      .finally(() => {
        checkRequestActiveRef.current = false;
      });

    /*
     * Die Benutzeroberfläche wartet maximal eine Sekunde.
     * Die Anfrage darf im Hintergrund noch fertig werden und
     * aktualisiert anschließend automatisch den Redux-State.
     */
    await waitAtMost(
      request,
      MAX_CHECK_WAIT_MS,
    );

    setIsChecking(false);
  }, [dispatch, ip]);

  const logoutAndOpenLogin = useCallback(async () => {
    setUpdatePhase("logout");

    setStatusText(
      t(
        "serverWeb.updateDialog.steps.logout",
        "Du wirst abgemeldet. Anschließend wird die Web-App neu geladen.",
      ),
    );

    setLogoutFlowActive(true);

    const logoutRequest = dispatch(
      logoutAsync(),
    )
      .unwrap()
      .catch((error) => {
        /*
         * Beim Update kann die Verbindung bereits unterbrochen
         * sein. Der Browser wird trotzdem zur Anmeldung geleitet.
         */
        console.warn(
          "[FRONTEND UPDATE] Logout request failed",
          error,
        );

        return undefined;
      });

    await waitAtMost(
      logoutRequest,
      MAX_LOGOUT_WAIT_MS,
    );

    clearUpdateSettingsCache();

    if (typeof window !== "undefined") {
      const loginUrl = new URL(
        "/login",
        window.location.origin,
      );

      /*
       * Der Zeitstempel verhindert, dass der Browser eine alte
       * Web-App-Version aus dem Cache verwendet.
       */
      loginUrl.searchParams.set(
        "updated",
        String(Date.now()),
      );

      window.location.replace(
        loginUrl.toString(),
      );

      return;
    }

    setLogoutFlowActive(false);
    setShowUpdateDialog(false);
    setIsInstalling(false);
  }, [dispatch, t]);

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
        /*
         * UPDATE.FRONTEND.EXECUTE wird nur einmal ausgelöst.
         *
         * Die Oberfläche wartet maximal eine Sekunde auf die
         * Antwort. Ein möglicher Verbindungsabbruch beim Update
         * blockiert den Benutzer dadurch nicht.
         */
        const executeRequest = dispatch(
          executeFrontendUpdate(),
        )
          .unwrap()
          .catch((error) => {
            /*
             * Der Request kann abbrechen, wenn die aktualisierte
             * Web-App oder der Server die Verbindung beendet.
             * Der Ablauf wird trotzdem mit Logout und Reload
             * fortgesetzt.
             */
            console.warn(
              "[FRONTEND UPDATE] Execute request interrupted",
              error,
            );

            return undefined;
          });

        await waitAtMost(
          executeRequest,
          MAX_EXECUTE_WAIT_MS,
        );

        clearUpdateSettingsCache();

        await logoutAndOpenLogin();
      } catch (error) {
        console.error(
          "[FRONTEND UPDATE] Update failed",
          error,
        );

        setUpdatePhase("error");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.failed",
            "Das Update konnte nicht gestartet werden. Bitte versuche es erneut.",
          ),
        );

        installRequestActiveRef.current = false;
        setIsInstalling(false);
      }
    }, [
      dispatch,
      ip,
      logoutAndOpenLogin,
      t,
    ]);

  const closeErrorDialog = useCallback(() => {
    if (updatePhase !== "error") {
      return;
    }

    installRequestActiveRef.current = false;

    setShowUpdateDialog(false);
    setIsInstalling(false);
  }, [updatePhase]);

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
              version:
                updateState.frontend.newVersion ||
                updateState.frontend.version ||
                "-",
              defaultValue:
                "Neues Update verfügbar",
            },
          )
        : t(
            "serverWeb.statusTexts.upToDate",
            "Aktuell",
          );

  const currentVersion =
    updateState.frontend.currentVersion ||
    updateState.frontend.version ||
    "-";

  const newVersion =
    updateState.frontend.newVersion ||
    (updateState.frontend.isAvailable
      ? updateState.frontend.version
      : "") ||
    "-";

  const lastCheckedAt =
    updateState.frontend.lastCheck || "-";

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
          {t("serverWeb.title", "Web-App")}
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