import dataAnalysisReducer from "@/template/state/agent-workbench/dataAnalysisSlice";
import execSettingsReducer from "@/template/state/agent-workbench/execSettingsSlice";

import type {
  ApplicationReducers,
} from "@/template/state/store/types";

/**
 * Redux reducers owned by the current application.
 *
 * These reducers are currently still located inside the template
 * repository and will later move to the Agent.Workbench repository.
 */
export const applicationReducers = {
  execSettings: execSettingsReducer,
  dataAnalysis: dataAnalysisReducer,
} satisfies ApplicationReducers;