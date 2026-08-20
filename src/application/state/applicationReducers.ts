import dataAnalysisReducer from "@/application/state/agent-workbench/dataAnalysisSlice";
import execSettingsReducer from "@/application/state/agent-workbench/execSettingsSlice";

import type {
  ApplicationReducers,
} from "@/template/state/store/types";

/**
 * Redux reducers owned by the concrete Application.
 *
 * Agent.Workbench-specific state belongs to the Application
 * and is injected into the reusable Base Template store.
 */
export const applicationReducers = {
  execSettings: execSettingsReducer,
  dataAnalysis: dataAnalysisReducer,
} satisfies ApplicationReducers;