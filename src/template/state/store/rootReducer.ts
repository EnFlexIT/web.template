import {
  combineReducers,
} from "@reduxjs/toolkit";

import {
  templateReducers,
} from "@/template/state/store/templateReducers";

/**
 * Legacy Template reducer used temporarily for type compatibility.
 *
 * Runtime store composition is owned by the concrete Application
 * through createTemplateStore().
 */
export const rootReducer =
  combineReducers(
    templateReducers,
  );

export type RootState =
  ReturnType<
    typeof rootReducer
  >;