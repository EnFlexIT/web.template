import {
  useDispatch,
  useSelector,
} from "react-redux";

import type {
  ApplicationDispatch,
  ApplicationRootState,
} from "@/application/state/applicationStore";

/**
 * Typed Redux hooks for the concrete application.
 *
 * Application code should use these hooks instead of the
 * Template-specific Redux hooks.
 */
export const useApplicationDispatch =
  useDispatch.withTypes<ApplicationDispatch>();

export const useApplicationSelector =
  useSelector.withTypes<ApplicationRootState>();