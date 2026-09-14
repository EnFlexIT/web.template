import fs from "node:fs";
import path from "node:path";

import {
  templateMenuCatalog,
  templateMenuRuntimeRules,
  templateTabCatalog,
  templateTabRuntimeRules,
} from "./templateNavigationCatalog.mjs";

const rootDirectory =
  process.cwd();

const configDirectory =
  path.join(
    rootDirectory,
    "src",
    "application",
    "config",
  );

const applicationPropertiesPath =
  path.join(
    configDirectory,
    "application.properties",
  );

const featuresPropertiesPath =
  path.join(
    configDirectory,
    "features.properties",
  );

const navigationPropertiesPath =
  path.join(
    configDirectory,
    "navigation.properties",
  );

const generatedDirectory =
  path.join(
    rootDirectory,
    "src",
    "application",
    "generated",
  );

const generatedFilePath =
  path.join(
    generatedDirectory,
    "applicationConfig.generated.ts",
  );

const customMenuIdStart = 3900;

/**
 * Parses the simple key=value subset of the
 * Java .properties format used by applications.
 */
function parseProperties(
  content,
) {
  const properties = {};

  for (
    const rawLine of
    content.split(/\r?\n/)
  ) {
    const line =
      rawLine.trim();

    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("!")
    ) {
      continue;
    }

    const separatorIndex =
      line.indexOf("=");

    if (
      separatorIndex < 0
    ) {
      throw new Error(
        `Invalid properties line: "${rawLine}". Expected key=value.`,
      );
    }

    const key =
      line
        .slice(
          0,
          separatorIndex,
        )
        .trim();

    const value =
      line
        .slice(
          separatorIndex + 1,
        )
        .trim();

    if (!key) {
      throw new Error(
        `Invalid properties line: "${rawLine}". Property key is empty.`,
      );
    }

    properties[key] =
      value;
  }

  return properties;
}

function readPropertiesFile(
  filePath,
) {
  if (
    !fs.existsSync(
      filePath,
    )
  ) {
    throw new Error(
      `Required configuration file does not exist: ${filePath}`,
    );
  }

  return parseProperties(
    fs.readFileSync(
      filePath,
      "utf8",
    ),
  );
}

function readOptionalPropertiesFile(
  filePath,
) {
  if (
    !fs.existsSync(
      filePath,
    )
  ) {
    return {};
  }

  return parseProperties(
    fs.readFileSync(
      filePath,
      "utf8",
    ),
  );
}

function requireProperty(
  properties,
  key,
) {
  const value =
    properties[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required application property: ${key}`,
    );
  }

  return value;
}

function parseInteger(
  value,
  description,
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed,
    )
  ) {
    throw new Error(
      `Invalid integer for ${description}: "${value}".`,
    );
  }

  return parsed;
}

function parseBoolean(
  value,
  description,
) {
  if (
    value === "true"
  ) {
    return true;
  }

  if (
    value === "false"
  ) {
    return false;
  }

  throw new Error(
    `Invalid boolean for ${description}: "${value}". Expected true or false.`,
  );
}

function getKnownFeatureNames() {
  const featureNames =
    new Set();

  for (
    const definition of
    Object.values(
      templateMenuCatalog,
    )
  ) {
    if (
      definition.feature
    ) {
      featureNames.add(
        definition.feature,
      );
    }

    for (
      const feature of
      definition.features ?? []
    ) {
      featureNames.add(
        feature,
      );
    }
  }

  for (
    const definition of
    Object.values(
      templateTabCatalog,
    )
  ) {
    if (
      definition.feature
    ) {
      featureNames.add(
        definition.feature,
      );
    }
  }

  return featureNames;
}

const knownFeatureNames =
  getKnownFeatureNames();

function parseTemplateFeatureConfiguration(
  properties,
) {
  const enabledFeatures =
    new Map();

  const pattern =
    /^feature\.(.+)\.enabled$/;

  for (
    const [
      key,
      value,
    ] of
    Object.entries(
      properties,
    )
  ) {
    const match =
      key.match(
        pattern,
      );

    if (!match) {
      throw new Error(
        `Unknown template feature property: "${key}".`,
      );
    }

    const featureName =
      match[1];

    if (
      !knownFeatureNames.has(
        featureName,
      )
    ) {
      throw new Error(
        `Unknown template feature: "${featureName}".`,
      );
    }

    enabledFeatures.set(
      featureName,
      parseBoolean(
        value,
        key,
      ),
    );
  }

  return enabledFeatures;
}

function parseApplicationNavigation(
  properties,
) {
  const menuItems =
    new Map();

  const tabItems =
    new Map();

  const menuPattern =
    /^menu\.([A-Za-z0-9_-]+)\.(enabled|caption|parent|position|screen)$/;

  const tabPattern =
    /^tab\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.(enabled|caption|position|screen)$/;

  for (
    const [
      key,
      value,
    ] of
    Object.entries(
      properties,
    )
  ) {
    const menuMatch =
      key.match(
        menuPattern,
      );

    if (menuMatch) {
      const menuKey =
        menuMatch[1];

      const propertyName =
        menuMatch[2];

      const item =
        menuItems.get(
          menuKey,
        ) ?? {
          key: menuKey,
        };

      switch (
        propertyName
      ) {
        case "enabled":
          item.enabled =
            parseBoolean(
              value,
              key,
            );
          break;

        case "caption":
          item.caption =
            value;
          break;

        case "parent":
          item.parent =
            value;
          break;

        case "position":
          item.position =
            parseInteger(
              value,
              key,
            );
          break;

        case "screen":
          item.screen =
            value;
          break;

        default:
          throw new Error(
            `Unsupported application menu property: "${key}".`,
          );
      }

      menuItems.set(
        menuKey,
        item,
      );

      continue;
    }

    const tabMatch =
      key.match(
        tabPattern,
      );

    if (tabMatch) {
      const menuKey =
        tabMatch[1];

      const tabKey =
        tabMatch[2];

      const propertyName =
        tabMatch[3];

      const internalKey =
        `${menuKey}:${tabKey}`;

      const item =
        tabItems.get(
          internalKey,
        ) ?? {
          menuKey,
          tabKey,
        };

      switch (
        propertyName
      ) {
        case "enabled":
          item.enabled =
            parseBoolean(
              value,
              key,
            );
          break;

        case "caption":
          item.caption =
            value;
          break;

        case "position":
          item.position =
            parseInteger(
              value,
              key,
            );
          break;

        case "screen":
          item.screen =
            value;
          break;

        default:
          throw new Error(
            `Unsupported application tab property: "${key}".`,
          );
      }

      tabItems.set(
        internalKey,
        item,
      );

      continue;
    }

    throw new Error(
      `Unknown application navigation property: "${key}".`,
    );
  }

  for (
    const item of
    menuItems.values()
  ) {
    if (
      item.enabled ===
      false
    ) {
      continue;
    }

    if (
      !item.caption
    ) {
      throw new Error(
        `Application menu "${item.key}" is missing caption.`,
      );
    }

    if (
      !item.screen
    ) {
      throw new Error(
        `Application menu "${item.key}" is missing screen.`,
      );
    }
  }

  for (
    const item of
    tabItems.values()
  ) {
    if (
      item.enabled ===
      false
    ) {
      continue;
    }

    if (
      !item.caption
    ) {
      throw new Error(
        `Application tab "${item.menuKey}.${item.tabKey}" is missing caption.`,
      );
    }

    if (
      !item.screen
    ) {
      throw new Error(
        `Application tab "${item.menuKey}.${item.tabKey}" is missing screen.`,
      );
    }
  }

  return {
    menuItems: [
      ...menuItems.values(),
    ],
    tabItems: [
      ...tabItems.values(),
    ],
  };
}

function renderMenuItem(
  item,
) {
  const lines = [
    "  {",
    `    caption: ${JSON.stringify(item.caption)},`,
    `    menuID: ${item.menuID},`,
  ];

  if (
    item.parentID !==
    undefined
  ) {
    lines.push(
      `    parentID: ${item.parentID},`,
    );
  }

  if (
    item.position !==
    undefined
  ) {
    lines.push(
      `    position: ${item.position},`,
    );
  }

  lines.push(
    `    Screen: resolveApplicationScreen(${JSON.stringify(item.screen)}),`,
    "  },",
  );

  return lines.join(
    "\n",
  );
}

function renderTabItem(
  tab,
) {
  const lines = [
    "  {",
    `    menuID: ${tab.menuID},`,
    `    tabKey: ${JSON.stringify(tab.tabKey)},`,
    `    caption: ${JSON.stringify(tab.caption)},`,
  ];

  if (
    tab.position !==
    undefined
  ) {
    lines.push(
      `    position: ${tab.position},`,
    );
  }

  if (
    tab.featureID !==
    undefined
  ) {
    lines.push(
      `    featureID: ${tab.featureID},`,
    );
  }

  lines.push(
    `    Content: resolveApplicationScreen(${JSON.stringify(tab.screen)}),`,
    "  },",
  );

  return lines.join(
    "\n",
  );
}

function renderMenuRule(
  menuID,
  rule,
) {
  const properties = [];

  if (
    rule.authInclude
  ) {
    properties.push(
      `authInclude: ${JSON.stringify(rule.authInclude)}`,
    );
  }

  if (
    rule.authExclude
  ) {
    properties.push(
      `authExclude: ${JSON.stringify(rule.authExclude)}`,
    );
  }

  return `  ${menuID}: { ${properties.join(", ")} },`;
}

function renderTabRule(
  featureID,
  rule,
) {
  const properties = [];

  if (
    rule.type
  ) {
    properties.push(
      `type: ${JSON.stringify(rule.type)}`,
    );
  }

  if (
    rule.statePath
  ) {
    properties.push(
      `statePath: ${JSON.stringify(rule.statePath)}`,
    );
  }

  if (
    rule.value !==
    undefined
  ) {
    properties.push(
      `value: ${JSON.stringify(rule.value)}`,
    );
  }

  return `  ${featureID}: { ${properties.join(", ")} },`;
}

const applicationProperties =
  readPropertiesFile(
    applicationPropertiesPath,
  );

const featureProperties =
  readPropertiesFile(
    featuresPropertiesPath,
  );

const navigationProperties =
  readOptionalPropertiesFile(
    navigationPropertiesPath,
  );

const applicationId =
  requireProperty(
    applicationProperties,
    "ApplicationId",
  );

const applicationTitle =
  requireProperty(
    applicationProperties,
    "ApplicationTitle",
  );

const enabledFeatures =
  parseTemplateFeatureConfiguration(
    featureProperties,
  );

const {
  menuItems:
    applicationMenuDefinitions,
  tabItems:
    applicationTabDefinitions,
} =
  parseApplicationNavigation(
    navigationProperties,
  );

function isFeatureEnabled(
  featureName,
) {
  return (
    enabledFeatures.get(
      featureName,
    ) === true
  );
}

const enabledApplicationMenus =
  applicationMenuDefinitions.filter(
    (item) =>
      item.enabled !== false,
  );

const enabledApplicationTabs =
  applicationTabDefinitions.filter(
    (item) =>
      item.enabled !== false,
  );

for (
  const item of
  enabledApplicationMenus
) {
  if (
    Object.hasOwn(
      templateMenuCatalog,
      item.key,
    )
  ) {
    throw new Error(
      `Application menu key "${item.key}" conflicts with a Base Template menu key.`,
    );
  }
}

const customMenuIds =
  new Map();

for (
  const [
    index,
    item,
  ] of
  enabledApplicationMenus.entries()
) {
  customMenuIds.set(
    item.key,
    customMenuIdStart +
      index,
  );
}

function getMenuId(
  menuKey,
) {
  if (
    Object.hasOwn(
      templateMenuCatalog,
      menuKey,
    )
  ) {
    return templateMenuCatalog[
      menuKey
    ].menuID;
  }

  const customMenuID =
    customMenuIds.get(
      menuKey,
    );

  if (
    customMenuID !==
    undefined
  ) {
    return customMenuID;
  }

  throw new Error(
    `Unknown menu reference: "${menuKey}".`,
  );
}

function getMenuParent(
  menuKey,
) {
  if (
    Object.hasOwn(
      templateMenuCatalog,
      menuKey,
    )
  ) {
    return templateMenuCatalog[
      menuKey
    ].parent;
  }

  const customMenu =
    enabledApplicationMenus.find(
      (item) =>
        item.key === menuKey,
    );

  return customMenu?.parent;
}

const selectedMenuKeys =
  new Set();

for (
  const [
    menuKey,
    definition,
  ] of
  Object.entries(
    templateMenuCatalog,
  )
) {
  const hasEnabledFeature =
    definition.feature
      ? isFeatureEnabled(
          definition.feature,
        )
      : (
          definition.features ?? []
        ).some(
          isFeatureEnabled,
        );

  if (
    hasEnabledFeature
  ) {
    selectedMenuKeys.add(
      menuKey,
    );
  }
}

for (
  const item of
  enabledApplicationMenus
) {
  selectedMenuKeys.add(
    item.key,
  );
}

for (
  const item of
  enabledApplicationTabs
) {
  selectedMenuKeys.add(
    item.menuKey,
  );
}

let parentAdded =
  true;

while (parentAdded) {
  parentAdded =
    false;

  for (
    const menuKey of
    [...selectedMenuKeys]
  ) {
    const parent =
      getMenuParent(
        menuKey,
      );

    if (
      parent &&
      !selectedMenuKeys.has(
        parent,
      )
    ) {
      getMenuId(
        parent,
      );

      selectedMenuKeys.add(
        parent,
      );

      parentAdded =
        true;
    }
  }
}

const menuItems = [];

for (
  const [
    menuKey,
    definition,
  ] of
  Object.entries(
    templateMenuCatalog,
  )
) {
  if (
    !selectedMenuKeys.has(
      menuKey,
    )
  ) {
    continue;
  }

  menuItems.push({
    caption:
      definition.caption,
    menuID:
      definition.menuID,
    parentID:
      definition.parent
        ? getMenuId(
            definition.parent,
          )
        : undefined,
    position:
      definition.position,
    screen:
      definition.screen,
  });
}

for (
  const item of
  enabledApplicationMenus
) {
  menuItems.push({
    caption:
      item.caption,
    menuID:
      getMenuId(
        item.key,
      ),
    parentID:
      item.parent
        ? getMenuId(
            item.parent,
          )
        : undefined,
    position:
      item.position,
    screen:
      item.screen,
  });
}

const tabItems = [];

const enabledTemplateTabKeys =
  new Set();

for (
  const [
    tabCatalogKey,
    definition,
  ] of
  Object.entries(
    templateTabCatalog,
  )
) {
  if (
    !isFeatureEnabled(
      definition.feature,
    )
  ) {
    continue;
  }

  if (
    !selectedMenuKeys.has(
      definition.menu,
    )
  ) {
    continue;
  }

  const runtimeRule =
    templateTabRuntimeRules[
      tabCatalogKey
    ];

  tabItems.push({
    menuID:
      getMenuId(
        definition.menu,
      ),
    tabKey:
      definition.tabKey,
    caption:
      definition.caption,
    position:
      definition.position,
    featureID:
      runtimeRule?.featureID ??
      definition.runtimeFeatureID,
    screen:
      definition.screen,
  });

  enabledTemplateTabKeys.add(
    tabCatalogKey,
  );
}

for (
  const item of
  enabledApplicationTabs
) {
  tabItems.push({
    menuID:
      getMenuId(
        item.menuKey,
      ),
    tabKey:
      item.tabKey,
    caption:
      item.caption,
    position:
      item.position,
    screen:
      item.screen,
  });
}

const menuRules =
  new Map();

for (
  const [
    menuKey,
    rule,
  ] of
  Object.entries(
    templateMenuRuntimeRules,
  )
) {
  if (
    !selectedMenuKeys.has(
      menuKey,
    )
  ) {
    continue;
  }

  menuRules.set(
    getMenuId(
      menuKey,
    ),
    rule,
  );
}

const tabRules =
  new Map();

for (
  const [
    tabCatalogKey,
    rule,
  ] of
  Object.entries(
    templateTabRuntimeRules,
  )
) {
  if (
    !enabledTemplateTabKeys.has(
      tabCatalogKey,
    )
  ) {
    continue;
  }

  const {
    featureID,
    ...runtimeRule
  } = rule;

  tabRules.set(
    featureID,
    runtimeRule,
  );
}

const renderedMenuItems =
  menuItems
    .map(
      renderMenuItem,
    )
    .join("\n");

const renderedTabItems =
  tabItems
    .map(
      renderTabItem,
    )
    .join("\n");

const renderedMenuRules =
  [
    ...menuRules.entries(),
  ]
    .map(
      ([menuID, rule]) =>
        renderMenuRule(
          menuID,
          rule,
        ),
    )
    .join("\n");

const renderedTabRules =
  [
    ...tabRules.entries(),
  ]
    .map(
      ([
        featureID,
        rule,
      ]) =>
        renderTabRule(
          featureID,
          rule,
        ),
    )
    .join("\n");

const generatedContent = `
// This file is generated automatically.
// Do not edit this file manually.

import type {
  ApplicationConfig,
  MenuVisibilityResolver,
  TabVisibilityResolver,
} from "@template";

import type {
  StaticMenuItem,
} from "@template";

import type {
  StaticTabItem,
} from "@template";

import {
  resolveApplicationScreen,
} from "../registry/applicationScreenRegistry";

type MenuFeatureRule = {
  authInclude?: readonly string[];
  authExclude?: readonly string[];
};

type TabFeatureRule = {
  type?: "stateEquals";
  statePath?: string;
  value?: string;
};

const menuItems:
  readonly StaticMenuItem[] = [
${renderedMenuItems}
];

const tabItems:
  readonly StaticTabItem[] = [
${renderedTabItems}
];

const menuFeatureRules:
  Readonly<
    Record<
      number,
      MenuFeatureRule
    >
  > = {
${renderedMenuRules}
};

const tabFeatureRules:
  Readonly<
    Record<
      number,
      TabFeatureRule
    >
  > = {
${renderedTabRules}
};

function readStatePath(
  state: unknown,
  statePath: string,
): unknown {
  let current:
    unknown = state;

  for (
    const segment of
    statePath.split(".")
  ) {
    if (
      typeof current !==
        "object" ||
      current === null
    ) {
      return undefined;
    }

    current =
      (
        current as
          Record<
            string,
            unknown
          >
      )[segment];
  }

  return current;
}

const isApplicationMenuEnabled:
  MenuVisibilityResolver = (
    menuID,
    context,
  ) => {
    const rule =
      menuFeatureRules[
        menuID
      ];

    if (!rule) {
      return true;
    }

    const authenticationMethod =
      context.authenticationMethod ??
      "unset";

    if (
      rule.authInclude &&
      !rule.authInclude.includes(
        authenticationMethod,
      )
    ) {
      return false;
    }

    if (
      rule.authExclude?.includes(
        authenticationMethod,
      )
    ) {
      return false;
    }

    return true;
  };

const isApplicationTabEnabled:
  TabVisibilityResolver = (
    featureID,
    context,
  ) => {
    const rule =
      tabFeatureRules[
        featureID
      ];

    if (!rule) {
      return true;
    }

    if (
      rule.type ===
      "stateEquals"
    ) {
      if (
        !rule.statePath
      ) {
        return false;
      }

      return (
        String(
          readStatePath(
            context.state,
            rule.statePath,
          ),
        ) ===
        rule.value
      );
    }

    return true;
  };

export const applicationConfig:
  ApplicationConfig = {
  id: ${JSON.stringify(applicationId)},
  displayName: ${JSON.stringify(applicationTitle)},

  navigation: {
    menu: {
      items: menuItems,
      isEnabled:
        isApplicationMenuEnabled,
    },

    tabs: {
      items: tabItems,
      isEnabled:
        isApplicationTabEnabled,
    },
  },
};
`.trimStart();

fs.mkdirSync(
  generatedDirectory,
  {
    recursive: true,
  },
);

fs.writeFileSync(
  generatedFilePath,
  generatedContent,
  "utf8",
);

console.log(
  [
    `Generated application configuration for "${applicationTitle}" (${applicationId}).`,
    `${menuItems.length} menu items.`,
    `${tabItems.length} tabs.`,
    `${menuRules.size} menu runtime rules.`,
    `${tabRules.size} tab runtime rules.`,
  ].join(" "),
);