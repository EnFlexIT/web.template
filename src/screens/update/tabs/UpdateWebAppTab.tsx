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
  reloadUpdatedFrontendWebApp,
} from "../../../redux/slices/reloadUpdatedFrontendWebApp";

import {
  UpdateProgressDialog,
  type UpdateProgressPhase,
} from "../Dialog/UpdateProgressDialog";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function UpdateWebAppTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);

  const updateState = useAppSelector(
    (state) => state.update,
  );

  const ip = api.ip;

  const checkRequestActiveRef =
    useRef(false);

  const installRequestActiveRef =
    useRef(false);

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
    useState<UpdateProgressPhase>(
      "installing",
    );

  /*
   * Bei manueller Update-Strategie wird beim Öffnen des Tabs geprüft.
   * Bei automatischer Strategie übernimmt der zentrale Watcher.
   */
  useEffect(() => {
    if (
      !ip ||
      updateState.autoUpdate
    ) {
      return;
    }

    void dispatch(
      checkFrontendUpdate(),
    )
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

  const checkNow =
    useCallback(async () => {
      if (
        !ip ||
        checkRequestActiveRef.current ||
        installRequestActiveRef.current
      ) {
        return;
      }

      checkRequestActiveRef.current =
        true;

      setIsChecking(true);

      try {
        await dispatch(
          checkFrontendUpdate(),
        ).unwrap();
      } catch (error) {
        console.warn(
          "[FRONTEND UPDATE] Update check failed",
          error,
        );
      } finally {
        checkRequestActiveRef.current =
          false;

        setIsChecking(false);
      }
    }, [dispatch, ip]);

  const availableVersion =
    updateState.frontend.newVersion ||
    updateState.frontend.version ||
    "-";

  const installFrontendUpdate =
    useCallback(async () => {
      if (
        !ip ||
        installRequestActiveRef.current ||
        checkRequestActiveRef.current
      ) {
        return;
      }

      installRequestActiveRef.current =
        true;

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
         * UPDATE.FRONTEND.EXECUTE genau einmal ausführen
         * und die echte Antwort vollständig abwarten.
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

        await wait(300);

        setUpdatePhase("restarting");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.restarting",
            "Browser-Cache wird bereinigt und die neue Web-App wird geladen…",
          ),
        );

        const reloadStarted =
          await reloadUpdatedFrontendWebApp({
            baseUrl: ip,
            version:
              availableVersion === "-"
                ? undefined
                : availableVersion,
          });

        if (!reloadStarted) {
          throw new Error(
            "Die aktualisierte Web-App konnte nicht neu geladen werden.",
          );
        }
      } catch (error) {
        console.error(
          "[FRONTEND UPDATE] Update failed",
          error,
        );

        installRequestActiveRef.current =
          false;

        setIsInstalling(false);
        setUpdatePhase("error");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.failed",
            "Das Frontend-Update wurde installiert, aber die neue Web-App konnte nicht geladen werden. Bitte lade die Seite erneut.",
          ),
        );
      }
    }, [
      dispatch,
      ip,
      availableVersion,
      t,
    ]);

  const closeErrorDialog =
    useCallback(() => {
      if (updatePhase !== "error") {
        return;
      }

      installRequestActiveRef.current =
        false;

      setShowUpdateDialog(false);
      setIsInstalling(false);
    }, [updatePhase]);

  const updateStatus =
    isInstalling
      ? t(
          "serverWeb.statusTexts.installing",
          "Update wird installiert",
        )
      : updateState.frontend.isPending
        ? t(
            "serverWeb.statusTexts.checking",
            "Suche nach Updates...",
          )
        : updateState.frontend.isAvailable
          ? t(
              "serverWeb.statusTexts.updateAvailable",
              {
                version:
                  availableVersion,
                defaultValue:
                  "Neues Update verfügbar",
              },
            )
          : updateState.frontend.lastCheck
            ? t(
                "serverWeb.statusTexts.upToDate",
                "Aktuell",
              )
            : t(
                "serverWeb.statusTexts.notChecked",
                "Noch nicht geprüft",
              );

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
              disabled={
                controlsDisabled
              }
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
              onPress={
                installFrontendUpdate
              }
              disabled={
                controlsDisabled
              }
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