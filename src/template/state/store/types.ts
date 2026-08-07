import type {
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