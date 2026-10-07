import React, {

  useCallback,

  useEffect,

  useRef,

  useState,

} from "react";
import {
  formatUpdateTimestamp,
} from "@/template/update/formatUpdateTimestamp";
import {

  StyleSheet,

  View,

} from "react-native";

import {

  useUnistyles,

} from "react-native-unistyles";

import {

  useTranslation,

} from "react-i18next";

import {

  useApplicationConfig,

} from "@/template/application/ApplicationConfigContext";

import {

  ActionButton,

  Card,

  Dropdown,

  FilterChip,

  Icon,

  TextInput,

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

type ReleaseSourceFilter =

  | "all"

  | "application"

  | "template";

type ReleaseHistoryFilter =

  | "latest"

  | "previous";

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

  const { theme } =

    useUnistyles();

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

  /**
   * Release notes are separated by their owner.
   *
   * "notes" belongs to the concrete Application.
   * "templateNotes" belongs to the reusable Base Template.
   */
  const applicationReleaseNotes =
    buildInfo?.release?.notes ??
    [];

  const templateReleaseNotes =
    buildInfo?.release?.templateNotes ??
    [];

  const templateReleaseHistory =
    buildInfo?.release?.templateHistory ??
    [];

  const previousTemplateRelease =
    templateReleaseHistory[0];

  const previousTemplateReleaseNotes =
    previousTemplateRelease?.notes ??
    [];

  const releaseNotesCount =
    applicationReleaseNotes.length +
    templateReleaseNotes.length;

  const [

    releaseSourceFilter,

    setReleaseSourceFilter,

  ] =

    useState<ReleaseSourceFilter>(

      "all",

    );

  const [

    releaseHistoryFilter,

    setReleaseHistoryFilter,

  ] =

    useState<ReleaseHistoryFilter>(

      "latest",

    );

  const [

    releaseSearch,

    setReleaseSearch,

  ] = useState("");

  const releaseHistoryOptions: Record<

    ReleaseHistoryFilter,

    string

  > = {

    latest: t(

      "serverWeb.releaseNotes.history.latest",

      "Letztes Update",

    ),

    previous: t(

      "serverWeb.releaseNotes.history.previous",

      "Frühere Updates",

    ),

  };

  const normalizedReleaseSearch =

    releaseSearch

      .trim()

      .toLocaleLowerCase();

  /**
   * Decide which release-note source is currently visible.
   *
   * "all"         -> Application + Base Template
   * "application" -> Application only
   * "template"    -> Base Template only
   */
  const sourceShowsApplication =
    releaseSourceFilter === "all" ||
    releaseSourceFilter ===
      "application";

  const sourceShowsTemplate =
    releaseSourceFilter === "all" ||
    releaseSourceFilter ===
      "template";

  /**
   * Build the visible release-note list according to
   * source, history selection and search text.
   */

  const visibleReleaseNotes =
    (
      releaseHistoryFilter ===
      "latest"
        ? [
            ...(
              sourceShowsApplication
                ? applicationReleaseNotes
                : []
            ),
            ...(
              sourceShowsTemplate
                ? templateReleaseNotes
                : []
            ),
          ]
        : (
            sourceShowsTemplate
              ? previousTemplateReleaseNotes
              : []
          )
    ).filter(
      (note) =>
        !normalizedReleaseSearch ||
        note
          .toLocaleLowerCase()
          .includes(
            normalizedReleaseSearch,
          ),
    );

  /**
   * Select the correct empty-state message.
   */

  const releaseEmptyText =
    releaseHistoryFilter ===
      "previous" &&
    releaseSourceFilter ===
      "application"
      ? t(
          "serverWeb.releaseNotes.empty.history",
          "Für frühere Application-Updates sind noch keine Historien-Daten verfügbar.",
        )
      : releaseHistoryFilter ===
          "previous" &&
        previousTemplateReleaseNotes.length ===
          0
        ? t(
            "serverWeb.releaseNotes.empty.history",
            "Für frühere Updates sind noch keine Historien-Daten verfügbar.",
          )
        : releaseSourceFilter ===
              "template" &&
            templateReleaseNotes.length ===
              0 &&
            releaseHistoryFilter ===
              "latest"
          ? t(
              "serverWeb.releaseNotes.empty.template",
              "Für das Basis-Template sind in diesem Build noch keine separaten Release Notes verfügbar.",
            )
          : releaseSourceFilter ===
                "application" &&
              applicationReleaseNotes.length ===
                0 &&
              releaseHistoryFilter ===
                "latest"
            ? t(
                "serverWeb.releaseNotes.empty.notes",
                "Für diesen Build sind keine Release Notes verfügbar.",
              )
            : visibleReleaseNotes.length ===
                0
              ? t(
                  "serverWeb.releaseNotes.empty.search",
                  "Keine Änderungen entsprechen der aktuellen Suche.",
                )
              : undefined;

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
  formatUpdateTimestamp(
    updateState.frontend.lastCheck,
  );

  /**
   * Determine which source should own the visible timeline entry.
   *
   * If "All" is selected but only one source actually contains
   * release notes, that source is shown directly.
   */

  const releaseEntrySource:
    ReleaseSourceFilter =
    releaseHistoryFilter ===
      "previous" &&
    sourceShowsTemplate
      ? "template"
      : releaseSourceFilter !== "all"
        ? releaseSourceFilter
        : applicationReleaseNotes.length ===
              0 &&
            templateReleaseNotes.length > 0
          ? "template"
          : templateReleaseNotes.length ===
                0 &&
              applicationReleaseNotes.length >
                0
            ? "application"
            : "all";

  /**
   * Use a source-specific icon in the release timeline.
   */
  const releaseEntryIcon =
    releaseEntrySource === "template"
      ? "codepen"
      : releaseEntrySource ===
          "application"
        ? "appstore"
        : "notification";

  /**
   * Human-readable title for the timeline entry.
   */
  const releaseEntryTitle =
    releaseEntrySource === "template"
      ? t(
          "serverWeb.build.template",
          "Basis-Template",
        )
      : releaseEntrySource ===
          "application"
        ? application.displayName
        : t(
            "serverWeb.releaseNotes.filters.all",
            "Alle",
          );

  /**
   * Badge displayed beside the timeline title.
   */
  const releaseEntrySourceLabel =
    releaseEntrySource === "template"
      ? t(
          "serverWeb.releaseNotes.sources.template",
          "Basis-Template",
        )
      : releaseEntrySource ===
          "application"
        ? t(
            "serverWeb.releaseNotes.sources.application",
            "Anwendung",
          )
        : t(
            "serverWeb.releaseNotes.filters.all",
            "Alle",
          );

  /**
   * The Application uses its release tag/current version.
   * The Base Template uses TemplateVersion.
   */

  const releaseEntryVersion =
    releaseHistoryFilter ===
      "previous"
      ? previousTemplateRelease?.version
      : releaseEntrySource ===
          "template"
        ? templateVersion
        : releaseEntrySource ===
            "application"
          ? (
              releaseTag !== "-"
                ? releaseTag
                : displayedCurrentVersion
            )
          : undefined;

  const releaseEntryTimestamp =
    releaseHistoryFilter ===
      "latest" &&
    buildTimestamp !== "-"
      ? buildTimestamp
      : undefined;

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

   <View style={s.contentGrid}>

    <View style={s.leftColumn}>

          <Card

            padding="md"

            style={s.summaryCard}

          >

            <View style={s.compactCardContent}>

              <View style={s.sectionHeadingRow}>

                <View

                  style={[

                    s.sectionIcon,

                    {

                      backgroundColor:

                        theme.colors.background,

                      borderColor:

                        theme.colors.border,

                    },

                  ]}

                >

                  <Icon

                    name="appstore"

                    size={18}

                    color={theme.colors.highlight}

                  />

                </View>

                <View style={s.sectionHeadingText}>

                  <H3>

                    {t(

                      "serverWeb.updateTitle",

                      "Web-App Update",

                    )}

                  </H3>

                  <ThemedText style={s.sectionSubtitle}>

                    {t(

                      "serverWeb.updateSubtitle",

                      "Aktueller Stand und verfügbare Updates der Web-App.",

                    )}

                  </ThemedText>

                </View>

              </View>

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

          <Card

            padding="md"

            style={s.summaryCard}

          >

            <View style={s.compactCardContent}>

              <View style={s.sectionHeadingRow}>

                <View

                  style={[

                    s.sectionIcon,

                    {

                      backgroundColor:

                        theme.colors.background,

                      borderColor:

                        theme.colors.border,

                    },

                  ]}

                >

                  <Icon

                    name="codepen"

                    size={18}

                    color={theme.colors.highlight}

                  />

                </View>

                <View style={s.sectionHeadingText}>

                  <H3>

                    {t(

                      "serverWeb.build.title",

                      "Build & Release",

                    )}

                  </H3>

                  <ThemedText style={s.sectionSubtitle}>

                    {t(

                      "serverWeb.build.subtitle",

                      "Technische Informationen zum aktuellen Build.",

                    )}

                  </ThemedText>

                </View>

              </View>

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

        </View>

        <View style={s.rightColumn}>

          <Card

            padding="md"

            style={s.releaseCard}

          >

            <View style={s.releaseCardContent}>

              <View style={s.sectionHeadingRow}>

                <View

                  style={[

                    s.sectionIcon,

                    {

                      backgroundColor:

                        theme.colors.background,

                      borderColor:

                        theme.colors.border,

                    },

                  ]}

                >

                  <Icon

                    name="notification"

                    size={18}

                    color={theme.colors.highlight}

                  />

                </View>

                <View style={s.sectionHeadingText}>

                  <H3>

                    {t(

                      "serverWeb.releaseNotes.title",

                      "Was ist neu?",

                    )}

                  </H3>

                  <ThemedText style={s.sectionSubtitle}>

                    {t(

                      "serverWeb.releaseNotes.subtitle",

                      "Übersicht der letzten Änderungen und Verbesserungen.",

                    )}

                  </ThemedText>

                </View>

              </View>

              <View style={s.releaseToolbar}>

                <View style={s.filterRow}>

                  <FilterChip

                    label={t(

                      "serverWeb.releaseNotes.filters.all",

                      "Alle",

                    )}

                    count={releaseNotesCount}

                    selected={

                      releaseSourceFilter ===

                      "all"

                    }

                    onPress={() => {

                      setReleaseSourceFilter(

                        "all",

                      );

                    }}

                  />

                  <FilterChip

                    label={t(

                      "serverWeb.releaseNotes.filters.application",

                      "Anwendung",

                    )}

                    icon="appstore"

                    count={applicationReleaseNotes.length}

                    selected={

                      releaseSourceFilter ===

                      "application"

                    }

                    onPress={() => {

                      setReleaseSourceFilter(

                        "application",

                      );

                    }}

                  />

                  <FilterChip

                    label={t(

                      "serverWeb.releaseNotes.filters.template",

                      "Basis-Template",

                    )}

                    icon="codepen"

                    count={templateReleaseNotes.length}

                    selected={

                      releaseSourceFilter ===

                      "template"

                    }

                    onPress={() => {

                      setReleaseSourceFilter(

                        "template",

                      );

                    }}

                  />

                </View>

                <View style={s.historyDropdown}>

                  <Dropdown

                    value={releaseHistoryFilter}

                    options={releaseHistoryOptions}

                    onChange={

                      setReleaseHistoryFilter

                    }

                    size="sm"

                    menuWidth={190}

                  />

                </View>

              </View>

              <TextInput

                value={releaseSearch}

                onChangeText={setReleaseSearch}

                placeholder={t(

                  "serverWeb.releaseNotes.searchPlaceholder",

                  "Änderungen durchsuchen…",

                )}

                size="sm"

                returnKeyType="search"

                right={

                  <Icon

                    name="search"

                    size={16}

                    color={theme.colors.text}

                  />

                }

              />

              <View

                style={[

                  s.releaseDivider,

                  {

                    backgroundColor:

                      theme.colors.border,

                  },

                ]}

              />

              {visibleReleaseNotes.length > 0 ? (

                <View style={s.releaseTimeline}>

                  <View style={s.releaseEntry}>

                    <View

                      style={[

                        s.timelineRail,

                        {

                          backgroundColor:

                            theme.colors.border,

                        },

                      ]}

                    />

                    <View

                      style={[

                        s.timelineDot,

                        {

                          backgroundColor:

                            theme.colors.highlight,

                          borderColor:

                            theme.colors.card,

                        },

                      ]}

                    />

                    <View style={s.releaseEntryContent}>

                      <View style={s.releaseEntryHeader}>

                        <View style={s.releaseEntryTitleRow}>

                          <Icon

                            name={releaseEntryIcon}

                            size={16}

                            color={theme.colors.highlight}

                          />

                          <ThemedText

                            style={s.releaseEntryTitle}

                          >

                            {releaseEntryTitle}

                          </ThemedText>

                          <View

                            style={[

                              s.sourceBadge,

                              {

                                borderColor:

                                  theme.colors.border,

                                backgroundColor:

                                  theme.colors.background,

                              },

                            ]}

                          >

                            <ThemedText

                              style={s.sourceBadgeText}

                            >

                              {releaseEntrySourceLabel}

                            </ThemedText>

                          </View>

                        </View>

                        <ThemedText

                          style={s.releaseEntryMeta}

                        >

                          {[

                            releaseEntryVersion &&
                              releaseEntryVersion !== "-"
                                ? releaseEntryVersion
                                : undefined,

                            releaseEntryTimestamp,

                          ]

                            .filter(Boolean)

                            .join(" · ")}

                        </ThemedText>

                      </View>

                      <View style={s.releaseNotesList}>

                        {visibleReleaseNotes.map(

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

                  </View>

                </View>

              ) : (

                <View

                  style={[

                    s.emptyState,

                    {

                      borderColor:

                        theme.colors.border,

                      backgroundColor:

                        theme.colors.background,

                    },

                  ]}

                >

                  <Icon

                    name="file"

                    size={22}

                    color={theme.colors.text}

                  />

                  <ThemedText style={s.emptyStateTitle}>

                    {t(

                      "serverWeb.releaseNotes.empty.title",

                      "Keine Einträge verfügbar",

                    )}

                  </ThemedText>

                  <ThemedText style={s.emptyStateText}>

                    {releaseEmptyText}

                  </ThemedText>

                </View>

              )}

            </View>

          </Card>

        </View>

      </View>

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

    width: "100%",

    paddingBottom: 24,

  },

contentGrid: {
    width: "100%",
    gap: 14,
    alignItems: "stretch",
  },

  leftColumn: {
    width: "100%",
    gap: 14,
  },

  rightColumn: {
    width: "100%",
    minWidth: 0,
  },

  summaryCard: {

    borderRadius: 0,

  },

  compactCardContent: {

    gap: 14,

  },

  releaseCard: {
    borderRadius: 0,
  },

  releaseCardContent: {
    gap: 14,
  },

  sectionHeadingRow: {

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 12,

  },

  sectionHeadingText: {

    flex: 1,

    minWidth: 0,

    gap: 3,

  },

  sectionIcon: {

    width: 40,

    height: 40,

    borderWidth: 1,

    borderRadius: 0,

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

  },

  sectionSubtitle: {

    fontSize: 12,

    lineHeight: 17,

    opacity: 0.65,

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

    maxWidth: "58%",

    flexShrink: 1,

    fontSize: 13,

    fontWeight: "600",

    textAlign: "right",

  },

  btnRow: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,

    justifyContent: "flex-start",

    paddingTop: 2,

  },

  releaseToolbar: {

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 12,

  },

  filterRow: {

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 8,

    flex: 1,

  },

  historyDropdown: {

    width: 200,

    flexShrink: 0,

  },

  releaseDivider: {

    height: 1,

    width: "100%",

    marginTop: 2,

  },

  releaseTimeline: {

    width: "100%",

  },

  releaseEntry: {

    position: "relative",

    flexDirection: "row",

    paddingLeft: 24,

  },

  timelineRail: {

    position: "absolute",

    left: 7,

    top: 9,

    bottom: 0,

    width: 1,

  },

  timelineDot: {

    position: "absolute",

    left: 2,

    top: 5,

    width: 11,

    height: 11,

    borderRadius: 999,

    borderWidth: 2,

  },

  releaseEntryContent: {

    flex: 1,

    minWidth: 0,

    gap: 12,

    paddingBottom: 6,

  },

  releaseEntryHeader: {

    gap: 4,

  },

  releaseEntryTitleRow: {

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 7,

  },

  releaseEntryTitle: {

    fontSize: 14,

    fontWeight: "700",

  },

  releaseEntryMeta: {

    fontSize: 11,

    opacity: 0.6,

  },

  sourceBadge: {

    paddingHorizontal: 7,

    paddingVertical: 2,

    borderWidth: 1,

    borderRadius: 999,

  },

  sourceBadgeText: {

    fontSize: 10,

    fontWeight: "600",

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

  emptyState: {

    flex: 1,

    minHeight: 270,

    borderWidth: 1,

    paddingHorizontal: 24,

    paddingTop: 76,

    paddingBottom: 32,

    alignItems: "center",

    justifyContent: "flex-start",

    gap: 10,

  },

  emptyStateTitle: {

    fontSize: 14,

    fontWeight: "700",

    textAlign: "center",

  },

  emptyStateText: {

    maxWidth: 460,

    fontSize: 12,

    lineHeight: 18,

    opacity: 0.7,

    textAlign: "center",

  },

});
