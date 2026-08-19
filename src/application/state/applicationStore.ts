import {
  createTemplateStore,
} from "@/template/state/store/createTemplateStore";

import {
  applicationReducers,
} from "@/application/state/applicationReducers";

/**
 * Redux store owned by the concrete application.
 *
 * The Base Template contributes its reusable reducers through
 * createTemplateStore(), while the Application contributes its
 * own reducers through applicationReducers.
 */
export const applicationStore =
  createTemplateStore({
    applicationReducers,
  });

export type ApplicationStore =
  typeof applicationStore;

export type ApplicationRootState =
  ReturnType<
    ApplicationStore["getState"]
  >;

export type ApplicationDispatch =
  ApplicationStore["dispatch"];