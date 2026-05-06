import type { RootState } from "../store";

export function isTabEnabled(flagID: number, state?: RootState): boolean {
  switch (flagID) {
    case 5001:
      return true;

    case 3111:
      return true;

    case 3000:
      return state?.execSettings?.appliedStartAs === "SERVER_MASTER";

    default:
      return true;
  }
}