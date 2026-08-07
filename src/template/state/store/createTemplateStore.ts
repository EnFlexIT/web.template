import {
  configureStore,
} from "@reduxjs/toolkit";

import {
  templateReducers,
} from "./templateReducers";

import type {
  ApplicationReducers,
} from "./types";

export type CreateTemplateStoreOptions<
  TApplicationReducers extends ApplicationReducers = {},
> = {
  applicationReducers?: TApplicationReducers;
};

/**
 * Creates the Redux store used by the Base Template.
 *
 * The store always contains the reducers owned by the Base Template.
 * Concrete applications may extend the store with their own reducers.
 *
 * Application reducers must not override reducers owned by the
 * Base Template.
 */
export function createTemplateStore<
  TApplicationReducers extends ApplicationReducers = {},
>(
  options: CreateTemplateStoreOptions<TApplicationReducers> = {},
) {
  const applicationReducers = (
    options.applicationReducers ?? {}
  ) as TApplicationReducers;

  const templateReducerKeys =
    new Set(Object.keys(templateReducers));

  const conflictingReducerKeys =
    Object.keys(applicationReducers).filter(
      (key) => templateReducerKeys.has(key),
    );

  if (conflictingReducerKeys.length > 0) {
    throw new Error(
      [
        "Application reducers must not override Base Template reducers.",
        `Conflicting reducer keys: ${conflictingReducerKeys.join(", ")}`,
      ].join(" "),
    );
  }

  const reducers = {
    ...templateReducers,
    ...applicationReducers,
  } as typeof templateReducers & TApplicationReducers;

  return configureStore({
    reducer: reducers,
  });
}