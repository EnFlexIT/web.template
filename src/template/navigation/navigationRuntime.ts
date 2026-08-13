import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

type RuntimeNavigationConfig =
  ApplicationConfig<any>["navigation"];

let runtimeNavigationConfig:
  | RuntimeNavigationConfig
  | null = null;

/**
 * Configures the Template navigation runtime.
 *
 * The concrete configuration is supplied by the Application.
 * The Template never imports a concrete Application directly.
 */
export function configureNavigationRuntime<
  TState = unknown,
>(
  navigation: ApplicationConfig<TState>["navigation"],
): void {
  runtimeNavigationConfig =
    navigation as RuntimeNavigationConfig;
}

/**
 * Returns the navigation configuration of the active Application.
 */
export function getNavigationRuntime():
  RuntimeNavigationConfig {
  if (!runtimeNavigationConfig) {
    throw new Error(
      "Navigation runtime has not been configured.",
    );
  }

  return runtimeNavigationConfig;
}

/**
 * Resets the runtime configuration.
 *
 * Intended primarily for isolated tests.
 */
export function resetNavigationRuntime(): void {
  runtimeNavigationConfig = null;
}