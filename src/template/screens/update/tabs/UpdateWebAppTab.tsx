import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  useTranslation,
} from "react-i18next";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ActionButton,
} from "@design-system";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  H3,
} from "@/template/components/design-system/stylistic/H3";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  selectApi,
} from "@/template/state/api/apiSlice";

import {
  checkFrontendUpdate,
  clearUpdateSettingsCache,
  executeFrontendUpdate,
  loadInstalledFrontendVersion,
} from "@/template/state/update/updateSlice";

import {
  reloadUpdatedFrontendWebApp,
} from "@/core/update/reloadUpdatedFrontendWebApp";

import {
  UpdateProgressDialog,
  type UpdateProgressPhase,
} from "@/template/components/design-system/ui-elements/UpdateProgressDialog";

const VERSION_REFRESH_ATTEMPTS = 12;
const VERSION_REFRESH_DELAY_MS = 500;

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds,
    );
  });
}

function formatBuildTimestamp(
  value: string | undefined,
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function sanitizeVersionValue(
  value: unknown,
): string {
  const normalized =
    String(value ?? "").trim();

  if (
    !normalized ||
    normalized === "-" ||
    normalized.toLowerCase() === "null" ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "n/a"
  ) {
    return "";
  }

  return normalized;
}

function normalizeVersion(
  value: unknown,
): string {
  return sanitizeVersionValue(value)
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, ".");
}

function versionsAreDifferent(
  currentVersion: string,
  newVersion: string,
): boolean {
  const current =
    normalizeVersion(currentVersion);

  const next =
    normalizeVersion(newVersion);

  return Boolean(
    current &&
      next &&
      current !== next,
  );
}

export function UpdateWebAppTab() {
  const { t } =
    useTranslation(["Update"]);

  const application =
    useApplicationConfig();

  const buildInfo =
    application.buildInfo;

  const releaseTag =
    buildInfo?.application.releaseTag ??
    "-";

  const templateVersion =
    buildInfo?.template.version ??
    "-";

  const buildTimestamp =
    formatBuildTimestamp(
      buildInfo?.build?.timestamp,
    );

  const commitSha =
    buildInfo?.build?.commitSha ??
    "-";

  const releaseNotes =
    buildInfo?.release?.notes ??
    [];

  const dispatch =
    useAppDispatch();

  const api =
    useAppSelector(selectApi);

  const updateState =
    useAppSelector(
      (state) => state.update,
    );

  const ip = api.ip;

  const checkRequestActiveRef =
    useRef(false);

  const installRequestActiveRef =
    useRef(false);

  const [
    isChecking,
    setIsChecking,
  ] = useState(false);

  const [
    isInstalling,
    setIsInstalling,
  ] = useState(false);

  const [
    showUpdateDialog,
    setShowUpdateDialog,
  ] = useState(false);

  const [
    statusText,
    setStatusText,
  ] = useState("");

  const [
    updatePhase,
    setUpdatePhase,
  ] =
    useState<UpdateProgressPhase>(
      "installing",
    );

  useEffect(() => {
    if (
      !ip ||
      updateState.frontend.currentVersion
    ) {
      return;
    }

    void dispatch(
      loadInstalledFrontendVersion(),
    )
      .unwrap()
      .catch((error) => {
        console.warn(
          "[FRONTEND UPDATE] Installed version could not be loaded",
          error,
        );
      });
  }, [
    dispatch,
    ip,
    updateState.frontend.currentVersion,
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
    }, [
      dispatch,
      ip,
    ]);

  const currentVersion =
    sanitizeVersionValue(
      updateState.frontend.currentVersion,
    );

  const availableVersion =
    sanitizeVersionValue(
      updateState.frontend.newVersion,
    ) ||
    sanitizeVersionValue(
      updateState.frontend.version,
    );

  const hasFrontendUpdate =
    !updateState.frontend.isPending &&
    updateState.frontend.isAvailable &&
    Boolean(availableVersion) &&
    versionsAreDifferent(
      currentVersion,
      availableVersion,
    );

  const waitForInstalledVersion =
    useCallback(
      async (
        previousVersion: string,
        expectedVersion: string,
      ): Promise<string> => {
        let latestVersion =
          previousVersion;

        for (
          let attempt = 0;
          attempt <
          VERSION_REFRESH_ATTEMPTS;
          attempt += 1
        ) {
          try {
            const result =
              await dispatch(
                loadInstalledFrontendVersion(),
              ).unwrap();

            latestVersion =
              result.currentVersion;

            const installedChanged =
              normalizeVersion(
                latestVersion,
              ) !==
              normalizeVersion(
                previousVersion,
              );

            const expectedInstalled =
              Boolean(
                sanitizeVersionValue(
                  expectedVersion,
                ),
              ) &&
              normalizeVersion(
                latestVersion,
              ) ===
                normalizeVersion(
                  expectedVersion,
                );

            if (
              expectedInstalled ||
              installedChanged
            ) {
              return latestVersion;
            }
          } catch (error) {
            console.warn(
              "[FRONTEND UPDATE] Version verification failed",
              error,
            );
          }

          await wait(
            VERSION_REFRESH_DELAY_MS,
          );
        }

        return latestVersion;
      },
      [dispatch],
    );

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

      const previousVersion =
        currentVersion;

      try {
        await dispatch(
          executeFrontendUpdate(),
        ).unwrap();

        setUpdatePhase("success");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.success",
            "Das Frontend-Update wurde erfolgreich ausgeführt.",
          ),
        );

        const installedVersion =
          await waitForInstalledVersion(
            previousVersion,
            availableVersion,
          );

        clearUpdateSettingsCache();

        setUpdatePhase("restarting");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.restarting",
            "Die Web-App wird vollständig neu geladen. Deine Anmeldung bleibt erhalten.",
          ),
        );

        await wait(250);

        const reloadStarted =
          await reloadUpdatedFrontendWebApp({
            baseUrl: ip,
            version:
              installedVersion ||
              availableVersion,
          });

        if (!reloadStarted) {
          throw new Error(
            "Die aktualisierte Web-App konnte nicht neu geladen werden.",
          );
        }
      } catch (error) {
        console.error(
          "[FRONTEND UPDATE] Installation or reload failed",
          error,
        );

        installRequestActiveRef.current =
          false;

        setIsInstalling(false);
        setUpdatePhase("error");

        setStatusText(
          t(
            "serverWeb.updateDialog.steps.failed",
            "Das Frontend-Update konnte nicht vollständig abgeschlossen werden. Bitte versuche es erneut.",
          ),
        );
      }
    }, [
      dispatch,
      ip,
      currentVersion,
      availableVersion,
      waitForInstalledVersion,
      t,
    ]);

  const closeErrorDialog =
    useCallback(() => {
      if (
        updatePhase !== "error"
      ) {
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
        : hasFrontendUpdate
          ? t(
              "serverWeb.statusTexts.updateAvailable",
              {
                version:
                  availableVersion,

                defaultValue:
                  "Update verfügbar",
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

  const displayedCurrentVersion =
    currentVersion || "-";

  const newVersion =
    hasFrontendUpdate
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
    <View style={s.page}>
      <UpdateProgressDialog
        visible={showUpdateDialog}
        statusText={statusText}
        phase={updatePhase}
        onClose={closeErrorDialog}
      />

      <Card>
        <View style={s.cardContent}>
          <H3>
            {t(
              "serverWeb.updateTitle",
              "Web-App Update",
            )}
          </H3>

          <Row
            label={t(
              "serverWeb.fields.acceptedVersion",
              "Installierte Version",
            )}
            value={displayedCurrentVersion}
          />

          <Row
            label={t(
              "serverWeb.fields.newVersion",
              "Verfügbare Version",
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

            {hasFrontendUpdate ? (
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

      <Card>
        <View style={s.cardContent}>
          <H3>
            {t(
              "serverWeb.build.title",
              "Build & Release",
            )}
          </H3>

          <Row
            label={t(
              "serverWeb.build.application",
              "Anwendung",
            )}
            value={application.displayName}
          />

          <Row
            label={t(
              "serverWeb.build.release",
              "Release",
            )}
            value={releaseTag}
          />

          <Row
            label={t(
              "serverWeb.build.template",
              "Basis-Template",
            )}
            value={templateVersion}
          />

          <Row
            label={t(
              "serverWeb.build.createdAt",
              "Erstellt am",
            )}
            value={buildTimestamp}
          />

          <Row
            label={t(
              "serverWeb.build.commit",
              "Commit",
            )}
            value={commitSha}
          />
        </View>
      </Card>

      {releaseNotes.length > 0 ? (
        <Card>
          <View style={s.cardContent}>
            <H3>
              {t(
                "serverWeb.releaseNotes.title",
                "Was ist neu?",
              )}
            </H3>

            <View style={s.releaseNotesList}>
              {releaseNotes.map(
                (note, index) => (
                  <View
                    key={`${index}-${note}`}
                    style={s.releaseNoteItem}
                  >
                    <ThemedText
                      style={s.releaseNoteBullet}
                    >
                      {"•"}
                    </ThemedText>

                    <ThemedText
                      style={s.releaseNoteText}
                    >
                      {note}
                    </ThemedText>
                  </View>
                ),
              )}
            </View>
          </View>
        </Card>
      ) : null}
    </View>
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
  page: {
    gap: 14,
  },

  cardContent: {
    gap: 14,
  },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  label: {
    flex: 1,
    fontSize: 12,
    opacity: 0.75,
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

  releaseNotesList: {
    gap: 8,
  },

  releaseNoteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  releaseNoteBullet: {
    fontSize: 13,
    lineHeight: 20,
  },

  releaseNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
