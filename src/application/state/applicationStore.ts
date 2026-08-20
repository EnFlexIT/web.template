import {
  createTemplateStore,
} from "@/template/state/store/createTemplateStore";

import type {
  TemplateRootState,
} from "@/template/state/store/templateReducers";

import {
  applicationReducers,
} from "@/application/state/applicationReducers";

/**
 * Redux store owned by the concrete application.
 *
 * The Base Template contributes its reusable reducers,
 * while the Application contributes its own reducers.
 */
export const applicationStore =
  createTemplateStore({
    applicationReducers,
  });

/**
 * State contributed by the concrete Application.
 *
 * Keeping this type derived from applicationReducers means
 * keys such as execSettings and dataAnalysis remain explicit
 * instead of being widened to a generic string index.
 */
export type ApplicationState = {
  [K in keyof typeof applicationReducers]:
    ReturnType<
      (typeof applicationReducers)[K]
    >;
};

/**
 * Complete state visible to the running Application.
 *
 * Application
 *   = Template state
 *   + Application-specific state
 */
export type ApplicationRootState =
  TemplateRootState &
  ApplicationState;

export type ApplicationStore =
  typeof applicationStore;

export type ApplicationDispatch =
  ApplicationStore["dispatch"];