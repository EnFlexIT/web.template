import { useEffect, useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { DataAnalysisPlatformTable } from "./components/DataAnalysisPlatformTable";
import { CpuMemoryCharts,ThreadChart,} from "./components/DataAnalysisCharts";
import { DataAnalysisSummaryCard } from "./components/DataAnalysisSummaryCard";
import { Card } from "../../components/ui-elements/Card";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { BackgroundPlatform } from "../../redux/slices/dataAnalysisSlice";
import {fetchDataAnalysis, selectDataAnalysisError,selectDataAnalysisHistory,selectDataAnalysisPlatforms,} from "../../redux/slices/dataAnalysisSlice";

function safeText(value: unknown, fallback = "-"): string {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function getPlatformName(platform: BackgroundPlatform) {
  return (
    platform.platformName ||
    platform.ipAddress ||
    platform.contactAgent
  );
}

function getPlatformTone(
  platform: BackgroundPlatform,
): "green" | "yellow" | "red" | "neutral" {
  if (!platform.currentlyAvailable) return "red";
  if (platform.currentThresholdExceeded) return "yellow";
  return "green";
}

function getPlatformRole(platform: BackgroundPlatform): string {
  return platform.server ? "Slave" : "Client";
}

export function DataAnalyzingTab() {
  const dispatch = useAppDispatch();

  const platforms = useAppSelector(selectDataAnalysisPlatforms);
  const history = useAppSelector(selectDataAnalysisHistory);
  const error = useAppSelector(selectDataAnalysisError);

  const [selectedPlatformName, setSelectedPlatformName] =
    useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchDataAnalysis());

    const interval = setInterval(() => {
      dispatch(fetchDataAnalysis());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (!selectedPlatformName && platforms.length > 0) {
      setSelectedPlatformName(getPlatformName(platforms[0]));
    }
  }, [platforms, selectedPlatformName]);

  const platformOptions = useMemo(() => {
    return platforms.reduce<Record<string, string>>((acc, platform) => {
      const name = getPlatformName(platform);
      acc[name] = name;
      return acc;
    }, {});
  }, [platforms]);

  const platformOptionMeta = useMemo(() => {
    return platforms.reduce<
      Record<
        string,
        {
          subtitle: string;
          tone: "green" | "yellow" | "red" | "neutral";
        }
      >
    >((acc, platform) => {
      const name = getPlatformName(platform);

      acc[name] = {
        subtitle: `${getPlatformRole(platform)} · CPU ${platform.currentCpuLoad.toFixed(
          2,
        )} % · Threads ${platform.currentNumThreads}`,
        tone: getPlatformTone(platform),
      };

      return acc;
    }, {});
  }, [platforms]);

  const selectedHistory = useMemo(() => {
    if (!selectedPlatformName) return [];

    return history.filter(
      (entry) => entry.platformName === selectedPlatformName,
    );
  }, [history, selectedPlatformName]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <View style={styles.headerTextBox}>
            <H4>Data Analyzing</H4>
            <ThemedText>
              Master / Slave Plattform Übersicht
            </ThemedText>
          </View>
        </View>

        {error ? (
          <Card style={styles.errorCard}>
            <ThemedText>{safeText(error)}</ThemedText>
          </Card>
        ) : null}
        

        {platforms.length > 0 ? (
          <View style={styles.content}>
            <Card style={styles.tableCard}>
              <DataAnalysisPlatformTable platforms={platforms} />
            </Card>
            
          <View style={styles.headerActions}>
            {selectedPlatformName ? (
              <Dropdown
                value={selectedPlatformName}
                options={platformOptions}
                optionMeta={platformOptionMeta}
                onChange={setSelectedPlatformName}
                size="sm"
                menuWidth={320}
                maxMenuHeight={360}
              
              />
            ) : null}
          </View>

            <View style={styles.dashboardGrid}>
              <View style={styles.mainColumn}>
                {selectedHistory.length > 0 ? (
                  <CpuMemoryCharts history={selectedHistory} />
                ) : null}
              </View>

              <View style={styles.sideColumn}>
                <DataAnalysisSummaryCard platforms={platforms} />

                {selectedHistory.length > 0 ? (
                  <ThreadChart history={selectedHistory} />
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme: any) => ({
  container: {
    width: "100%",
    alignSelf: "center",
    padding: 24,
  },

  pageCard: {
    width: "100%",
    gap: 24,
  },

  pageHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
    bottom: 4,
  },

  headerTextBox: {
    flex: 1,
    gap: 4,
  },

  headerActions: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
   
  },

  content: {
    width: "100%",
    gap: 24,
  },

  dashboardGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
  },

  sideColumn: {
    width: 320,
    gap: 24,
  },

  errorCard: {
    borderColor: theme.colors.border,
    borderWidth: 1,
  },

  tableCard: {
    width: "100%",
    gap: 12,
  },
}));