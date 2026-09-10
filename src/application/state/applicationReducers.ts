import dataAnalysisReducer from "@/application/state/agent-workbench/dataAnalysisSlice";
import dbSettingsReducer from "@/application/state/agent-workbench/dbSettingsSlice";
import execSettingsReducer from "@/application/state/agent-workbench/execSettingsSlice";

import type {
  ApplicationReducers,
} from "@template";

/**
 * Redux state owned by the concrete Application.
 *
 * Agent.Workbench-specific state belongs to the Application
 * and is composed with the reusable Template reducers.
 */
export const applicationReducers = {
  execSettings: execSettingsReducer,
  dataAnalysis: dataAnalysisReducer,
  dbSettings: dbSettingsReducer,
} satisfies ApplicationReducers;