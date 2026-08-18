import fs from "node:fs";
import path from "node:path";

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

const menuPropertiesPath =
  path.join(
    configDirectory,
    "menu.properties",
  );

const tabsPropertiesPath =
  path.join(
    configDirectory,
    "tabs.properties",
  );

const featureFlagsPropertiesPath =
  path.join(
    configDirectory,
    "featureFlags.properties",
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

function parseList(
  value,
) {
  return value
    .split(",")
    .map(
      (entry) =>
        entry.trim(),
    )
    .filter(Boolean);
}

function parseMenuConfiguration(
  properties,
) {
  const menuItems =
    new Map();

  const pattern =
    /^menu\.(\d+)\.(caption|parentId|position|screen)$/;

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
      key.match(pattern);

    if (!match) {
      throw new Error(
        `Unknown menu property: "${key}".`,
      );
    }

    const menuID =
      parseInteger(
        match[1],
        `${key} menu id`,
      );

    const propertyName =
      match[2];

    const item =
      menuItems.get(
        menuID,
      ) ?? {
        menuID,
      };

    switch (
      propertyName
    ) {
      case "caption":
        item.caption =
          value;
        break;

      case "parentId":
        item.parentID =
          parseInteger(
            value,
            key,
          );
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
          `Unsupported menu property: "${key}".`,
        );
    }

    menuItems.set(
      menuID,
      item,
    );
  }

  for (
    const item of
    menuItems.values()
  ) {
    if (
      !item.caption
    ) {
      throw new Error(
        `Menu ${item.menuID} is missing caption.`,
      );
    }

    if (
      !item.screen
    ) {
      throw new Error(
        `Menu ${item.menuID} is missing screen.`,
      );
    }
  }

  return [
    ...menuItems.values(),
  ];
}

function parseTabConfiguration(
  properties,
) {
  const tabs =
    new Map();

  const pattern =
    /^tab\.(\d+)\.([^.]+)\.(caption|position|screen|featureId)$/;

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
      key.match(pattern);

    if (!match) {
      throw new Error(
        `Unknown tab property: "${key}".`,
      );
    }

    const menuID =
      parseInteger(
        match[1],
        `${key} menu id`,
      );

    const tabKey =
      match[2];

    const propertyName =
      match[3];

    const internalKey =
      `${menuID}:${tabKey}`;

    const tab =
      tabs.get(
        internalKey,
      ) ?? {
        menuID,
        tabKey,
      };

    switch (
      propertyName
    ) {
      case "caption":
        tab.caption =
          value;
        break;

      case "position":
        tab.position =
          parseInteger(
            value,
            key,
          );
        break;

      case "screen":
        tab.screen =
          value;
        break;

      case "featureId":
        tab.featureID =
          parseInteger(
            value,
            key,
          );
        break;

      default:
        throw new Error(
          `Unsupported tab property: "${key}".`,
        );
    }

    tabs.set(
      internalKey,
      tab,
    );
  }

  for (
    const tab of
    tabs.values()
  ) {
    if (
      !tab.caption
    ) {
      throw new Error(
        `Tab ${tab.menuID}.${tab.tabKey} is missing caption.`,
      );
    }

    if (
      !tab.screen
    ) {
      throw new Error(
        `Tab ${tab.menuID}.${tab.tabKey} is missing screen.`,
      );
    }
  }

  return [
    ...tabs.values(),
  ];
}

function parseFeatureConfiguration(
  properties,
) {
  const menuRules =
    new Map();

  const tabRules =
    new Map();

  const menuPattern =
    /^feature\.menu\.(\d+)\.(enabled|authInclude|authExclude)$/;

  const tabPattern =
    /^feature\.tab\.(\d+)\.(enabled|type|statePath|value)$/;

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
      const menuID =
        parseInteger(
          menuMatch[1],
          `${key} menu id`,
        );

      const propertyName =
        menuMatch[2];

      const rule =
        menuRules.get(
          menuID,
        ) ?? {};

      switch (
        propertyName
      ) {
        case "enabled":
          rule.enabled =
            parseBoolean(
              value,
              key,
            );
          break;

        case "authInclude":
          rule.authInclude =
            parseList(
              value,
            );
          break;

        case "authExclude":
          rule.authExclude =
            parseList(
              value,
            );
          break;

        default:
          throw new Error(
            `Unsupported menu feature property: "${key}".`,
          );
      }

      menuRules.set(
        menuID,
        rule,
      );

      continue;
    }

    const tabMatch =
      key.match(
        tabPattern,
      );

    if (tabMatch) {
      const featureID =
        parseInteger(
          tabMatch[1],
          `${key} feature id`,
        );

      const propertyName =
        tabMatch[2];

      const rule =
        tabRules.get(
          featureID,
        ) ?? {};

      switch (
        propertyName
      ) {
        case "enabled":
          rule.enabled =
            parseBoolean(
              value,
              key,
            );
          break;

        case "type":
          if (
            value !==
            "stateEquals"
          ) {
            throw new Error(
              `Unsupported tab feature type for ${key}: "${value}".`,
            );
          }

          rule.type =
            value;
          break;

        case "statePath":
          rule.statePath =
            value;
          break;

        case "value":
          rule.value =
            value;
          break;

        default:
          throw new Error(
            `Unsupported tab feature property: "${key}".`,
          );
      }

      tabRules.set(
        featureID,
        rule,
      );

      continue;
    }

    throw new Error(
      `Unknown feature flag property: "${key}".`,
    );
  }

  for (
    const [
      featureID,
      rule,
    ] of tabRules
  ) {
    if (
      rule.type ===
      "stateEquals"
    ) {
      if (
        !rule.statePath
      ) {
        throw new Error(
          `Tab feature ${featureID} uses stateEquals but has no statePath.`,
        );
      }

      if (
        rule.value ===
        undefined
      ) {
        throw new Error(
          `Tab feature ${featureID} uses stateEquals but has no value.`,
        );
      }
    }
  }

  return {
    menuRules,
    tabRules,
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
    rule.enabled !==
    undefined
  ) {
    properties.push(
      `enabled: ${rule.enabled}`,
    );
  }

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
    rule.enabled !==
    undefined
  ) {
    properties.push(
      `enabled: ${rule.enabled}`,
    );
  }

  if (rule.type) {
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

const menuProperties =
  readPropertiesFile(
    menuPropertiesPath,
  );

const tabsProperties =
  readPropertiesFile(
    tabsPropertiesPath,
  );

const featureProperties =
  readPropertiesFile(
    featureFlagsPropertiesPath,
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

const menuItems =
  parseMenuConfiguration(
    menuProperties,
  );

const tabItems =
  parseTabConfiguration(
    tabsProperties,
  );

const {
  menuRules,
  tabRules,
} =
  parseFeatureConfiguration(
    featureProperties,
  );

const referencedTabFeatures =
  new Set(
    tabItems
      .filter(
        (tab) =>
          tab.featureID !==
          undefined,
      )
      .map(
        (tab) =>
          tab.featureID,
      ),
  );

for (
  const featureID of
  referencedTabFeatures
) {
  if (
    !tabRules.has(
      featureID,
    )
  ) {
    throw new Error(
      `Tab feature ${featureID} is referenced by tabs.properties but has no rule in featureFlags.properties.`,
    );
  }
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
} from "@/template/application/ApplicationConfig";

import type {
  StaticMenuItem,
} from "@/template/navigation/menu/types";

import type {
  StaticTabItem,
} from "@/template/navigation/tabs/types";

import {
  resolveApplicationScreen,
} from "@/application/registry/applicationScreenRegistry";

type MenuFeatureRule = {
  enabled?: boolean;
  authInclude?: readonly string[];
  authExclude?: readonly string[];
};

type TabFeatureRule = {
  enabled?: boolean;
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

    if (
      rule.enabled ===
      false
    ) {
      return false;
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
      rule.enabled ===
      false
    ) {
      return false;
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
    `${menuRules.size} menu feature rules.`,
    `${tabRules.size} tab feature rules.`,
  ].join(" "),
);