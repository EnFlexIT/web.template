import type {ApplicationConfig,} from "@/template/application/ApplicationConfig";

const configuredApplicationId = process.env.EXPO_PUBLIC_APPLICATION_ID?.trim();

const configuredApplicationTitle = process.env.EXPO_PUBLIC_APPLICATION_TITLE?.trim();

/**
 * Konfiguration der aktuell gebauten Application.
 *
 * Navigation wird aktuell noch über die bestehenden
 * Template-Registries bereitgestellt.
 *
 * Die Navigation wird erst in einem späteren Schritt
 * kontrolliert auf die ApplicationConfig umgestellt.
 */
export const applicationConfig: ApplicationConfig = {
  id:
    configuredApplicationId ||
    "base-template",

  displayName:
    configuredApplicationTitle ||
    "Base Template",

  navigation: {
    menu: {
      items: [],

      isEnabled: () => true,
    },

    tabs: {
      items: [],

      isEnabled: () => true,
    },
  },
};