import type {
  TabVisibilityResolver,
} from "@/template/application/ApplicationConfig";

export type ApplicationNavigationState = {
  execSettings?: {
    appliedStartAs?: string;
  };
};

export const isApplicationTabEnabled: TabVisibilityResolver<
  ApplicationNavigationState
> = (
  featureID,
  context,
) => {
  switch (featureID) {
    case 5001:
      return true;

    case 3111:
      return true;

    case 3000:
      return (
        context.state?.execSettings?.appliedStartAs ===
        "SERVER_MASTER"
      );

    default:
      return true;
  }
};