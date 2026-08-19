import type {
  EnhancedStore,
  Reducer,
  UnknownAction,
} from "@reduxjs/toolkit";

/**
 * Reducers provided by a concrete application.
 *
 * The Base Template must not import concrete application reducers.
 * Applications register their reducers through this contract.
 */
export type ApplicationReducers = Record<
  string,
  Reducer<any, UnknownAction>
>;

/**
 * Store instance consumed by the reusable Template shell.
 *
 * The concrete store is created by the Application.
 */
export type TemplateStore =
  EnhancedStore<any, UnknownAction>;