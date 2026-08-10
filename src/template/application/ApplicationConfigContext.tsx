import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

export type ApplicationConfigContextValue = Pick<
  ApplicationConfig<unknown>,
  "id" | "displayName"
>;

const ApplicationConfigContext =
  createContext<ApplicationConfigContextValue | null>(
    null,
  );

type ApplicationConfigProviderProps = {
  config: ApplicationConfigContextValue;
  children: ReactNode;
};

export function ApplicationConfigProvider({
  config,
  children,
}: ApplicationConfigProviderProps) {
  return (
    <ApplicationConfigContext.Provider
      value={config}
    >
      {children}
    </ApplicationConfigContext.Provider>
  );
}

export function useApplicationConfig(): ApplicationConfigContextValue {
  const context =
    useContext(ApplicationConfigContext);

  if (!context) {
    throw new Error(
      "useApplicationConfig must be used within an ApplicationConfigProvider.",
    );
  }

  return context;
}