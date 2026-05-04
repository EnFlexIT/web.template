import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  fetchDataAnalysis,
  selectDataAnalysisError,
  selectDataAnalysisLoading,
  selectDataAnalysisPlatforms,
} from "../../redux/slices/dataAnalysisSlice";

function formatPercent(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toFixed(2)} %`;
}

function formatMemory(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toFixed(0)} MB`;
}

function formatNumber(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return String(value);
}

function formatDecimal(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function formatDate(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function safeText(value: unknown, fallback = "-"): string {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

export function DataAnalyzingTab() {
  const dispatch = useAppDispatch();

  const platforms = useAppSelector(selectDataAnalysisPlatforms);
  const isLoading = useAppSelector(selectDataAnalysisLoading);
  const error = useAppSelector(selectDataAnalysisError);

  useEffect(() => {
    dispatch(fetchDataAnalysis());
  }, [dispatch]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <H4>Data Analyzing</H4>
          <ThemedText>Master / Slave Plattform Übersicht</ThemedText>
        </View>

        <ActionButton
          label="Aktualisieren"
          onPress={() => dispatch(fetchDataAnalysis())}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <ThemedText>Daten werden geladen...</ThemedText>
        </View>
      ) : null}

      {error ? (
        <Card >
          <ThemedText>{safeText(error)}</ThemedText>
        </Card>
      ) : null}

      {!isLoading && platforms.length === 0 && !error ? (
        <Card>
          <ThemedText>Keine Background-Plattformen gefunden.</ThemedText>
        </Card>
      ) : null}

      {platforms.map((platform, index) => {
        const title = safeText(
          platform.platformName,
          `Plattform ${index + 1}`,
        );

        return (
          <Card key={`${title}-${index}`} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTextBox}>
                <H4>{title}</H4>
                <ThemedText>{safeText(platform.contactAgent)}</ThemedText>
              </View>

              <View style={styles.badge}>
                <ThemedText>
                  {platform.server ? "Master Server" : "Slave"}
                </ThemedText>
              </View>
            </View>

            <View style={styles.grid}>
              <Info
                label="Verfügbar"
                value={platform.currentlyAvailable ? "Ja" : "Nein"}
              />
              <Info label="IP-Adresse" value={platform.ipAddress} />
              <Info label="JADE Port" value={formatNumber(platform.jadePort)} />
              <Info label="HTTP MTP" value={platform.httpMtp} />
              <Info label="Version" value={platform.version} />
              <Info
                label="OS"
                value={`${safeText(platform.osName, "")} ${safeText(
                  platform.osVersion,
                  "",
                )}`.trim()}
              />
              <Info label="Architektur" value={platform.osArchitecture} />
              <Info label="CPU" value={platform.cpuName} />
              <Info
                label="CPU logisch"
                value={formatNumber(platform.cpuLogical)}
              />
              <Info
                label="CPU physisch"
                value={formatNumber(platform.cpuPhysical)}
              />
              <Info
                label="CPU Speed"
                value={
                  platform.cpuSpeedMhz
                    ? `${formatNumber(platform.cpuSpeedMhz)} MHz`
                    : "-"
                }
              />
              <Info label="Memory" value={formatMemory(platform.memoryMb)} />
              <Info
                label="Benchmark"
                value={formatDecimal(platform.benchmarkValue)}
              />
              <Info
                label="CPU Load"
                value={formatPercent(platform.currentCpuLoad)}
              />
              <Info
                label="Memory Load"
                value={formatPercent(platform.currentMemoryLoad)}
              />
              <Info
                label="JVM Memory Load"
                value={formatPercent(platform.currentMemoryLoadJvm)}
              />
              <Info
                label="Threads"
                value={formatNumber(platform.currentNumThreads)}
              />
              <Info
                label="Threshold"
                value={
                  platform.currentThresholdExceeded ? "Überschritten" : "OK"
                }
              />
              <Info
                label="Online seit"
                value={formatDate(platform.onlineSince)}
              />
              <Info
                label="Letzter Kontakt"
                value={formatDate(platform.lastContact)}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <View style={styles.infoBox}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText>{safeText(value)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  headerTextBox: {
    flex: 1,
    gap: 4,
  },
  loadingBox: {
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorCard: {
    borderColor: theme.colors,
    borderWidth: 1,
  },
  card: {
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  cardHeaderTextBox: {
    flex: 1,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBox: {
    width: 220,
    gap: 4,
  },
  infoLabel: {
    opacity: 0.65,
  },
}));