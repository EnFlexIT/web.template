import {
  useSelector,
} from "react-redux";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

/**
 * Typed selector hook for reusable Template state.
 */
export const useAppSelector =
  useSelector.withTypes<
    TemplateRootState
  >();