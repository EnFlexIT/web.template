import type {
  Dispatch,
  ThunkDispatch,
  UnknownAction,
} from "@reduxjs/toolkit";

import type {
  TemplateRootState,
} from "@/template/state/store/templateReducers";

/**
 * Redux state owned by the reusable Base Template.
 *
 * Concrete applications may extend this state with their
 * own reducers, but Template code must only depend on this
 * state contract.
 */
export type {
  TemplateRootState,
};

/**
 * Dispatch contract required by reusable Template code.
 *
 * The default Redux Toolkit thunk middleware uses
 * `undefined` as its extra argument.
 *
 * This type deliberately does not depend on a concrete
 * Application store.
 */
export type TemplateDispatch =
  ThunkDispatch<
    TemplateRootState,
    undefined,
    UnknownAction
  > &
  Dispatch<UnknownAction>;