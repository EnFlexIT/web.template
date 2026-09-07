import {
  useDispatch,
} from "react-redux";

import type {
  TemplateDispatch,
} from "@/template/state/store/templateStoreTypes";

/**
 * Typed dispatch hook for reusable Template code.
 *
 * The concrete Application provides the runtime store.
 */
export const useAppDispatch =
  useDispatch.withTypes<
    TemplateDispatch
  >();