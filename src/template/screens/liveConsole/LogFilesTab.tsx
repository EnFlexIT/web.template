import React, {
  useEffect,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  View,
} from "react-native";

import {
  useTranslation,
} from "react-i18next";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  ActionButton,
  Card,
  ThemedText,
} from "@design-system";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  clearLogDownloadError,
  downloadLogArchive,
  loadLogFiles,
  selectAvailableLogDates,
  selectLogArchiveDownloadError,
  selectLogArchiveDownloading,
  selectLogFilesError,
  selectLogFilesLoading,
} from "@/template/state/developer-tools/logFilesSlice";

import {
  LogDateInput,
} from "@/template/screens/liveConsole/components/LogDateInput";

//**************************************************************************** */

function formatLogDate(
  value: string,
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return value;
  }

  const [
    ,
    year,
    month,
    day,
  ] = match;

  return `${day}.${month}.${year}`;
}

//**************************************************************************** */

export function LogFilesTab() {
  const { t } =
    useTranslation([
      "liveConsole",
    ]);

  const dispatch =
    useAppDispatch();

  const availableDates =
    useAppSelector(
      selectAvailableLogDates,
    );

  const loading =
    useAppSelector(
      selectLogFilesLoading,
    );

  const error =
    useAppSelector(
      selectLogFilesError,
    );

  const downloadLoading =
    useAppSelector(
      selectLogArchiveDownloading,
    );

  const downloadError =
    useAppSelector(
      selectLogArchiveDownloadError,
    );

  const [
    from,
    setFrom,
  ] =
    useState("");

  const [
    to,
    setTo,
  ] =
    useState("");

  useEffect(() => {
    void dispatch(
      loadLogFiles(),
    );
  }, [dispatch]);

  useEffect(() => {
    const newestDate =
      availableDates[0];

    if (!newestDate) {
      return;
    }

    if (!from) {
      setFrom(
        newestDate,
      );
    }

    if (!to) {
      setTo(
        newestDate,
      );
    }
  }, [
    availableDates,
    from,
    to,
  ]);

 const hasAvailableLogsInRange =
  Boolean(
    from &&
      to &&
      availableDates.some(
        (date) =>
          date >= from &&
          date <= to,
      ),
  );

const canDownload =
  Boolean(
    from &&
      to &&
      from <= to &&
      hasAvailableLogsInRange &&
      !downloadLoading,
  );

  function selectDate(
    date: string,
  ) {
    setFrom(date);
    setTo(date);

    dispatch(
      clearLogDownloadError(),
    );
  }

  function handleDownload() {
    if (!canDownload) {
      return;
    }

    void dispatch(
      downloadLogArchive({
        from,
        to,
      }),
    );
  }

  return (
    <View style={s.container}>
      <Card>
        <View style={s.content}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.headerText}>
              <ThemedText
                style={s.title}
              >
                {t(
                  "logFiles.title",
                )}
              </ThemedText>

              <ThemedText
                style={s.description}
              >
                {t(
                  "logFiles.description",
                )}
              </ThemedText>
            </View>

            <View style={s.headerActions}>
              <ActionButton
                label={
                  loading
                    ? t(
                        "logFiles.loading",
                      )
                    : t(
                        "logFiles.reload",
                      )
                }
                icon="reload"
                iconSize={17}
                variant="secondary"
                size="md"
                disabled={loading}
                onPress={() => {
                  void dispatch(
                    loadLogFiles(),
                  );
                }}
              />

              <ActionButton
                label={
                  downloadLoading
                    ? t(
                        "logFiles.downloading",
                      )
                    : t(
                        "logFiles.downloadZip",
                      )
                }
                icon="download"
                iconSize={18}
                variant="filled"
                size="md"
                disabled={
                  !canDownload
                }
                onPress={
                  handleDownload
                }
              />
            </View>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <ThemedText
                style={s.errorText}
              >
                {error}
              </ThemedText>
            </View>
          ) : null}

          {/* Zeitraum */}
          <View style={s.rangePanel}>
            <View style={s.rangeMain}>
              <ThemedText
                style={s.sectionTitle}
              >
                {t(
                  "logFiles.downloadRange",
                )}
              </ThemedText>

              <ThemedText
                style={s.description}
              >
                {t(
                  "logFiles.downloadRangeDescription",
                )}
              </ThemedText>

              <View style={s.dateRow}>
                <LogDateInput
                  label={t(
                    "logFiles.from",
                  )}
                  value={from}
                  disabled={
                    downloadLoading
                  }
                  onChange={(
                    value,
                  ) => {
                    setFrom(
                      value,
                    );

                    dispatch(
                      clearLogDownloadError(),
                    );
                  }}
                />

                <View
                  style={
                    s.rangeSeparator
                  }
                >
                  <ThemedText
                    style={
                      s.rangeSeparatorText
                    }
                  >
                    →
                  </ThemedText>
                </View>

                <LogDateInput
                  label={t(
                    "logFiles.to",
                  )}
                  value={to}
                  disabled={
                    downloadLoading
                  }
                  onChange={(
                    value,
                  ) => {
                    setTo(
                      value,
                    );

                    dispatch(
                      clearLogDownloadError(),
                    );
                  }}
                />
              </View>
            </View>

            <View style={s.hintBox}>
              <ThemedText
                style={s.hintTitle}
              >
                {t(
                  "logFiles.hintTitle",
                )}
              </ThemedText>

              <ThemedText
                style={s.hintText}
              >
                {t(
                  "logFiles.hintText",
                )}
              </ThemedText>

              {from && to ? (
                <View
                  style={
                    s.rangeSummary
                  }
                >
                  <ThemedText
                    style={
                      s.rangeSummaryLabel
                    }
                  >
                    {t(
                      "logFiles.selectedRange",
                    )}
                  </ThemedText>

                  <ThemedText
                    style={
                      s.rangeSummaryValue
                    }
                  >
                    {formatLogDate(
                      from,
                    )}
                    {" – "}
                    {formatLogDate(
                      to,
                    )}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {downloadError ? (
            <View style={s.errorBox}>
              <ThemedText
                style={s.errorText}
              >
                {downloadError}
              </ThemedText>
            </View>
          ) : null}

          {/* Dateien */}
          <View style={s.filesSection}>
            <View style={s.filesHeader}>
              <View>
                <ThemedText
                  style={s.sectionTitle}
                >
                  {t(
                    "logFiles.availableFiles",
                  )}
                </ThemedText>

                <ThemedText
                  style={s.description}
                >
                  {t(
                    "logFiles.selectDateHint",
                  )}
                </ThemedText>
              </View>

              <ThemedText
                style={s.fileCount}
              >
                {t(
                  "logFiles.fileCount",
                  {
                    count:
                      availableDates.length,
                  },
                )}
              </ThemedText>
            </View>

            {loading &&
            availableDates.length ===
              0 ? (
              <ThemedText
                style={s.mutedText}
              >
                {t(
                  "logFiles.loading",
                )}
              </ThemedText>
            ) : null}

            {!loading &&
            !error &&
            availableDates.length ===
              0 ? (
              <ThemedText
                style={s.mutedText}
              >
                {t(
                  "logFiles.noFiles",
                )}
              </ThemedText>
            ) : null}

            {availableDates.length >
            0 ? (
              <View style={s.fileList}>
                <View
                  style={s.tableHeader}
                >
                  <ThemedText
                    style={
                      s.tableHeaderText
                    }
                  >
                    {t(
                      "logFiles.date",
                    )}
                  </ThemedText>

                  <ThemedText
                    style={
                      s.tableHeaderStatus
                    }
                  >
                    {t(
                      "logFiles.status",
                    )}
                  </ThemedText>
                </View>

                <ScrollView
                  style={
                    s.fileListScroll
                  }
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                >
                  {availableDates.map(
                    (date) => {
                      const selected =
                        from ===
                          date &&
                        to ===
                          date;

                      return (
                        <Pressable
                          key={date}
                          accessibilityRole="button"
                          onPress={() => {
                            selectDate(
                              date,
                            );
                          }}
                          style={({
                            pressed,
                          }) => [
                            s.tableRow,

                            selected &&
                              s.tableRowSelected,

                            pressed &&
                              s.tableRowPressed,
                          ]}
                        >
                          <ThemedText
                            style={[
                              s.dateText,

                              selected &&
                                s.selectedText,
                            ]}
                          >
                            {formatLogDate(
                              date,
                            )}
                          </ThemedText>

                          <View
                            style={[
                              s.statusBadge,

                              selected &&
                                s.statusBadgeSelected,
                            ]}
                          >
                            <ThemedText
                              style={
                                s.statusBadgeText
                              }
                            >
                              {selected
                                ? t(
                                    "logFiles.selected",
                                  )
                                : ""}
                            </ThemedText>
                          </View>
                        </Pressable>
                      );
                    },
                  )}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}

//**************************************************************************** */

const s = StyleSheet.create(
  (theme) => ({
    container: {
      width: "100%",
      maxWidth: 1400,
      alignSelf: "center",
      padding: 24,
    },

    content: {
      gap: 24,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      flexWrap: "wrap",
      gap: 20,
    },

    headerText: {
      gap: 4,
      flexShrink: 1,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    },

    title: {
      fontSize: 21,
      fontWeight: "700",
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
    },

    description: {
      fontSize: 13,
      opacity: 0.68,
      lineHeight: 19,
    },

    rangePanel: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems:
        "stretch",
      gap: 24,

      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 8,

      padding: 20,
    },

    rangeMain: {
      flex: 2,
      minWidth: 460,
      gap: 8,
    },

    dateRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      flexWrap: "wrap",
      gap: 14,
      marginTop: 8,
    },

    rangeSeparator: {
      minHeight: 42,
      justifyContent:
        "center",
      alignItems: "center",
      paddingBottom: 1,
    },

    rangeSeparatorText: {
      fontSize: 20,
      opacity: 0.5,
    },

    hintBox: {
      flex: 1,
      minWidth: 280,
      maxWidth: 430,

      justifyContent:
        "center",

      gap: 6,

      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 7,

      backgroundColor:
        theme.colors.background,

      paddingHorizontal: 18,
      paddingVertical: 16,
    },

    hintTitle: {
      fontWeight: "700",
      fontSize: 14,
    },

    hintText: {
      fontSize: 13,
      opacity: 0.72,
      lineHeight: 19,
    },

    rangeSummary: {
      marginTop: 8,
      gap: 2,
    },

    rangeSummaryLabel: {
      fontSize: 12,
      opacity: 0.6,
    },

    rangeSummaryValue: {
      fontSize: 14,
      fontWeight: "700",
    },

    filesSection: {
      gap: 12,
    },

    filesHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
      flexWrap: "wrap",
      gap: 12,
    },

    fileCount: {
      fontSize: 12,
      opacity: 0.6,
    },

    fileList: {
      width: "100%",
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 7,
      overflow: "hidden",
    },

    fileListScroll: {
      maxHeight: 390,
    },

    tableHeader: {
      minHeight: 42,
      paddingHorizontal: 16,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      borderBottomWidth: 1,
      borderBottomColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.card,
    },

    tableHeaderText: {
      fontWeight: "700",
      fontSize: 13,
    },

    tableHeaderStatus: {
      fontWeight: "700",
      fontSize: 13,
      opacity: 0.7,
    },

    tableRow: {
      minHeight: 50,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 16,
      paddingVertical: 10,

      borderBottomWidth: 1,
      borderBottomColor:
        theme.colors.border,
    },

    tableRowSelected: {
      backgroundColor:
        theme.colors.highlight +
        "12",
    },

    tableRowPressed: {
      opacity: 0.65,
    },

    dateText: {
      fontSize: 14,
    },

    selectedText: {
      fontWeight: "700",
    },

    statusBadge: {
      minWidth: 95,
      minHeight: 26,

      alignItems: "center",
      justifyContent:
        "center",

      paddingHorizontal: 10,

      borderRadius: 999,
    },

    statusBadgeSelected: {
      borderWidth: 1,
      borderColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.background,
    },

    statusBadgeText: {
      fontSize: 12,
    },

    errorBox: {
      borderWidth: 1,
      borderColor:
        "rgba(239,68,68,0.55)",

      backgroundColor:
        "rgba(239,68,68,0.08)",

      borderRadius: 8,
      padding: 12,
    },

    errorText: {
      color: "#ef4444",
      fontSize: 13,
    },

    mutedText: {
      fontSize: 13,
      opacity: 0.7,
    },
  }),
);