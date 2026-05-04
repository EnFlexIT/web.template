import { useEffect } from "react";
import { DataAnalysisPlatformTable } from "./components/DataAnalysisPlatformTable";
import { DataAnalysisCharts } from "./components/DataAnalysisCharts";
import { DataAnalysisSummaryCard } from "./components/DataAnalysisSummaryCard";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  fetchDataAnalysis,
  selectDataAnalysisError,
  selectDataAnalysisHistory,
  selectDataAnalysisLoading,
  selectDataAnalysisPlatforms,
} from "../../redux/slices/dataAnalysisSlice";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native-unistyles"; function safeText(value: unknown, fallback = "-"): string { if (value === undefined || value === null || value === "") { return fallback; } return String(value); } export function DataAnalyzingTab() { const dispatch = useAppDispatch(); const platforms = useAppSelector(selectDataAnalysisPlatforms); const history = useAppSelector(selectDataAnalysisHistory); const isLoading = useAppSelector(selectDataAnalysisLoading); const error = useAppSelector(selectDataAnalysisError); useEffect(() => { dispatch(fetchDataAnalysis()); const interval = setInterval(() => { dispatch(fetchDataAnalysis()); }, 5000); return () => clearInterval(interval); }, [dispatch]); return ( <ScrollView contentContainerStyle={styles.container}> <View style={styles.pageHeader}> <View style={styles.headerTextBox}> <H4>Data Analyzing</H4> <ThemedText>Master / Slave Plattform Übersicht</ThemedText> </View> <ActionButton label="Aktualisieren" onPress={() => dispatch(fetchDataAnalysis())} /> </View> {isLoading ? ( <View style={styles.loadingBox}> <ActivityIndicator /> <ThemedText>Daten werden geladen...</ThemedText> </View> ) : null} {error ? ( <Card style={styles.errorCard}> <ThemedText>{safeText(error)}</ThemedText> </Card> ) : null} {!isLoading && platforms.length === 0 && !error ? ( <Card style={styles.emptyCard}> <ThemedText>Keine Background-Plattformen gefunden.</ThemedText> </Card> ) : null} {platforms.length > 0 ? ( <View style={styles.content}> <Card style={styles.tableCard}> <DataAnalysisPlatformTable platforms={platforms} /> </Card> <View style={styles.dashboardGrid}> <View style={styles.mainColumn}> {history.length > 0 ? ( <DataAnalysisCharts history={history} /> ) : null} </View> <View style={styles.sideColumn}> <DataAnalysisSummaryCard platforms={platforms} /> </View> </View> </View> ) : null} </ScrollView> ); } const styles = StyleSheet.create((theme: any) => ({
  container: { width: "100%", alignSelf: "center", padding: 24, gap: 24 },
  pageHeader: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  headerTextBox: { flex: 1, gap: 4 },
  content: { width: "100%", gap: 24 },
  dashboardGrid: { width: "100%", flexDirection: "row", gap: 24, alignItems: "stretch" },
  mainColumn: { flex: 1, minWidth: 0 },
  sideColumn: { width: 320 },
  loadingBox: { gap: 8, alignItems: "center", justifyContent: "center", padding: 24 },
  errorCard: { borderColor: theme.colors.border, borderWidth: 1 },
  emptyCard: { width: "100%" },
  tableCard: { width: "100%", gap: 12 },
}));