import type {
  MenuVisibilityResolver,
} from "@/template/application/ApplicationConfig";

export const menuFeatureFlags: Record<number, boolean> = {
  3011: false,
  3012: true,
  3013: true,
  3014: true,
  3010: true,
  3024: true,
  3025: true,
};

export const isApplicationMenuEnabled: MenuVisibilityResolver = (
  menuID,
  context,
) => {
  const { authenticationMethod } = context;

  if (
    menuID === 3013 &&
    authenticationMethod === "oidc"
  ) {
    return false;
  }

  if (menuID === 3025) {
    return (
      authenticationMethod === "oidc" ||
      authenticationMethod === undefined
    );
  }

  return menuFeatureFlags[menuID] ?? true;
};