import React, {
  useCallback,
  useEffect,
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
  selectAuthenticationMethod,
} from "../../../redux/slices/apiSlice";

import { setLogoutFlowActive } from "../../../redux/slices/logoutFlowGuard";

import {
  checkFrontendUpdate,
  clearUpdateSettingsCache,
  executeFrontendUpdate,
  loadUpdateSettingsIfNeeded,
} from "../../../redux/slices/updateSlice";

import { checkServerReachable } from "../../login/serverCheck";

import {
  UpdateProgressDialog,
  UpdateProgressPhase,
} from "../Dialog/UpdateProgressDialog";

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function findEntryValue(
  entries: unknown,
  key: string,
): unknown {
  if (!Array.isArray(entries)) {
    return undefined;
  }

  return entries.find(
    (entry: any) => entry?.key === key,
  )?.value;
}

function toBoolean(value: unknown): boolean {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

export function UpdateWebAppTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);

  const authenticationMethod = useAppSelector(
    selectAuthenticationMethod,
  );

  const updateState = useAppSelector(
    (state) => state.update,
  );

  const ip = api.ip;
  const jwt = api.jwt;

  const [isChecking, setIsChecking] =
    useState(false);

  const [
    showUpdateDialog,
    setShowUpdateDialog,
  ] = useState(false);

  const [statusText, setStatusText] =
    useState("");

  const [updatePhase, setUpdatePhase] =
    useState<UpdateProgressPhase>("installing");

  useEffect(() => {
    dispatch(
      loadUpdateSettingsIfNeeded({
        force: false,
        maxAgeMs: 30 * 60 * 1000,
      }),
    );
  }, [dispatch]);

  const checkNow = useCallback(async () => {
    if (!ip || isChecking) {
      return;
    }

    setIsChecking(true);

    try {
      await dispatch(
        checkFrontendUpdate(),
      ).unwrap();

      await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      ).unwrap();
    } catch (error) {
      console.error(
        "[FRONTEND UPDATE] Update check failed",
        error,
      );
    } finally {
      setIsChecking(false);
    }
  }, [dispatch, ip, isChecking]);

  const logoutAndReload = useCallback(async () => {
    setUpdatePhase("success");

    setStatusText(
      t(
        "serverWeb.updateDialog.steps.success",
        "Das Update wurde installiert. Die Web-App wird neu geladen.",
      ),
    );

    await sleep(1000);

    setUpdatePhase("logout");

    setStatusText(
      t(
        "serverWeb.updateDialog.steps.logout",
        "Du wirst abgemeldet. Anschließend wird die Web-App neu geladen.",
      ),
    );

    setLogoutFlowActive(true);

    try {
      await dispatch(logoutAsync()).unwrap();
    } catch (error) {
      /*
       * Ein Logout kann während eines Server-Neustarts
       * fehlschlagen. Die lokale Sitzung wird trotzdem
       * beendet und die Login-Seite neu geladen.
       */
      console.warn(
        "[FRONTEND UPDATE] Logout request failed",
        error,
      );
    }

    clearUpdateSettingsCache();

    if (typeof window !== "undefined") {
      /*
       * Nicht window.location.reload() verwenden.
       *
       * Sonst würde beispielsweise eine bestehende
       * /error?... URL erneut geladen werden.
       *
       * Der Zeitstempel verhindert zusätzlich, dass eine
       * alte HTML-Datei aus dem Browser-Cache geladen wird.
       */
      window.location.replace(
        `/login?updated=${Date.now()}`,
      );

      return;
    }

    setLogoutFlowActive(false);
    setShowUpdateDialog(false);
    setIsChecking(false);
  }, [dispatch, t]);

  const waitForUpdatedWebApp =
    useCallback(async (): Promise<boolean> => {
      const maxAttempts = 90;
      const minimumAttempts = 3;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
      ) {
        try {
          const reachable =
            await checkServerReachable(
              ip,
              jwt,
              authenticationMethod,
              {
                force: true,
              },
            );

          if (!reachable.ok) {
            setUpdatePhase("restarting");

            setStatusText(
              t(
                "serverWeb.updateDialog.steps.restarting",
                "Die Anwendung wird neu gestartet...",
              ),
            );
          } else {
            setUpdatePhase("reconnecting");

            setStatusText(
              t(
                "serverWeb.updateDialog.steps.reconnecting",
                "Die Verbindung wird wiederhergestellt...",
              ),
            );

            if (attempt >= minimumAttempts) {
              try {
                const entries = await dispatch(
                  checkFrontendUpdate(),
                ).unwrap();

                const isPending = toBoolean(
                  findEntryValue(
                    entries,
                    "updatecheck.frontend.ispending",
                  ),
                );

                const isAvailable = toBoolean(
                  findEntryValue(
                    entries,
                    "updatecheck.frontend.isavailable",
                  ),
                );

                if (!isPending && !isAvailable) {
                  return true;
                }
              } catch {
                /*
                 * Der Server ist möglicherweise bereits
                 * erreichbar, aber das Update-System noch
                 * nicht vollständig gestartet.
                 */
              }
            }
          }
        } catch {
          setUpdatePhase("restarting");

          setStatusText(
            t(
              "serverWeb.updateDialog.steps.restarting",
              "Die Anwendung wird neu gestartet...",
            ),
          );
        }

        await sleep(2000);
      }

      return false;
    }, [
      authenticationMethod,
      dispatch,
      ip,
      jwt,
      t,
    ]);

  const installFrontendUpdate =
    useCallback(async () => {
      if (
        !ip ||
        isChecking ||
        updateState.loading
      ) {
        return;
      }

      setIsChecking(true);
      setShowUpdateDialog(true);
      setUpdatePhase("installing");

      setStatusText(
        t(
          "serverWeb.updateDialog.steps.installing",
          "Die neue Version der Web-App wird installiert...",
        ),
      );

      try {
        /*
         * Die Anfrage kann während des Updates abbrechen,
         * falls der Server oder die Web-App neu gestartet
         * wird. Deshalb beginnt die Prüfung auch nach einem
         * Request-Fehler.
         */
        try {
          await dispatch(
            executeFrontendUpdate(),
          ).unwrap();
        } catch (error) {
          console.warn(
            "[FRONTEND UPDATE] Execute request interrupted",
            error,
          );
        }

        setUpdatePhase("restarting");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.restarting",
            "Die Anwendung wird neu gestartet...",
          ),
        );

        const updateFinished =
          await waitForUpdatedWebApp();

        if (!updateFinished) {
          setUpdatePhase("error");

          setStatusText(
            t(
              "serverWeb.updateDialog.steps.failed",
              "Das Update konnte nicht bestätigt werden. Bitte versuche es erneut.",
            ),
          );

          setIsChecking(false);
          return;
        }

        await logoutAndReload();
      } catch (error) {
        console.error(
          "[FRONTEND UPDATE] Update failed",
          error,
        );

        setUpdatePhase("error");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.failed",
            "Das Update konnte nicht abgeschlossen werden.",
          ),
        );

        setIsChecking(false);
      }
    }, [
      dispatch,
      ip,
      isChecking,
      logoutAndReload,
      t,
      updateState.loading,
      waitForUpdatedWebApp,
    ]);

  const updateStatus =
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
              defaultValue: "Update verfügbar",
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

  return (
    <Card>
      <UpdateProgressDialog
        visible={showUpdateDialog}
        statusText={statusText}
        phase={updatePhase}
        onClose={() => {
          if (updatePhase !== "error") {
            return;
          }

          setShowUpdateDialog(false);
          setIsChecking(false);
        }}
      />

      <View style={s.container}>
        <H3>
          {t("serverWeb.title", "Web-App")}
        </H3>

        <Row
          label={t(
            "serverWeb.fields.acceptedVersion",
            "Aktuelle Version",
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
            "Status",
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
                    "Suche nach Updates...",
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
              isChecking ||
              !ip ||
              updateState.loading
            }
          />

          {updateState.frontend.isAvailable ? (
            <ActionButton
              label={t(
                "serverWeb.actions.executeUpdate",
                "Update installieren",
              )}
              variant="primary"
              size="xs"
              onPress={installFrontendUpdate}
              disabled={
                isChecking ||
                updateState.loading ||
                !ip
              }
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function Row(props: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.rowLine}>
      <ThemedText style={s.label}>
        {props.label}
      </ThemedText>

      <ThemedText style={s.value}>
        {props.value || "-"}
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