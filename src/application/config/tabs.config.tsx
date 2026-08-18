import type {
  StaticTabItem,
} from "@/template/navigation/tabs/types";

import {
  DerbyNetworkServerTab,
} from "@/template/screens/settings/database/DerbyNetworkServerTab";

import {
  FactorySettingsTab,
} from "@/template/screens/settings/database/FactorySettingsTab";

import {
  GeneralSettingsTab,
} from "@/template/screens/settings/database/GeneralSettingsTab";

import {
  UpdateGeneralTab,
} from "@/template/screens/update/tabs/UpdateGeneralTab";

import {
  UpdateWebAppTab,
} from "@/template/screens/update/tabs/UpdateWebAppTab";

import {
  UpdateBackendTab,
} from "@/template/screens/update/tabs/UpdateBackendTab";

import {
  ProgramStartTab,
} from "@/template/screens/AgentWorkbenchOptions/ProgramStartTab";

import {
  DataAnalyzingTab,
} from "@/template/screens/AgentWorkbenchOptions/DataAnalyzingTab";

export const applicationTabItems:
  readonly StaticTabItem[] = [
  // Database Connections
  {
    menuID: 3010,
    tabKey: "general",
    caption: "General",
    position: 1,
    Content: GeneralSettingsTab,
  },
  {
    menuID: 3010,
    tabKey: "factory",
    caption: "Factory Settings",
    position: 2,
    featureID: 5001,
    Content: FactorySettingsTab,
  },
  {
    menuID: 3010,
    tabKey: "derby",
    caption: "Derby Network Server",
    position: 3,
    Content: DerbyNetworkServerTab,
  },

  // Update
  {
    menuID: 3014,
    tabKey: "general",
    caption: "General",
    position: 1,
    Content: UpdateGeneralTab,
  },
  {
    menuID: 3014,
    tabKey: "webapp",
    caption: "Web-App",
    position: 2,
    Content: UpdateWebAppTab,
  },
  {
    menuID: 3014,
    tabKey: "backend",
    caption: "Backend",
    position: 3,
    featureID: 3111,
    Content: UpdateBackendTab,
  },

  // Agent.Workbench Options
  {
    menuID: 3023,
    tabKey: "program-start",
    caption: "Program Start",
    position: 1,
    Content: ProgramStartTab,
  },
  {
    menuID: 3023,
    tabKey: "data-analyzing",
    caption: "Data Analyzing",
    position: 2,
    featureID: 3000,
    Content: DataAnalyzingTab,
  },
];