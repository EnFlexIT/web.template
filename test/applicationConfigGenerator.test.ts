import {
  execFileSync,
} from "node:child_process";

import fs from "node:fs";
import path from "node:path";

const rootDirectory =
  process.cwd();

const generatorPath =
  path.join(
    rootDirectory,
    "src",
    "template",
    "config",
    "build",
    "generateApplicationConfig.mjs",
  );

const accessConfigPath =
  path.join(
    rootDirectory,
    "src",
    "application",
    "config",
    "access.properties",
  );

const generatedConfigPath =
  path.join(
    rootDirectory,
    "src",
    "application",
    "generated",
    "applicationConfig.generated.ts",
  );

describe(
  "application configuration generator access integration",
  () => {
    let accessConfig:
      string;

    let generatedConfig:
      string;

    beforeAll(
      () => {
        execFileSync(
          process.execPath,
          [
            generatorPath,
          ],
          {
            cwd:
              rootDirectory,

            stdio:
              "pipe",
          },
        );

        accessConfig =
          fs.readFileSync(
            accessConfigPath,
            "utf8",
          );

        generatedConfig =
          fs.readFileSync(
            generatedConfigPath,
            "utf8",
          );
      },
    );

    it(
      "uses EDITOR and ADMIN for system settings access",
      () => {
        expect(
          accessConfig,
        ).toContain(
          "access.systemSettings.roles=EDITOR,ADMIN",
        );

        expect(
          generatedConfig,
        ).toContain(
          'roles: ["EDITOR","ADMIN"]',
        );
      },
    );

    it(
      "does not generate USER access for restricted system settings",
      () => {
        expect(
          generatedConfig,
        ).not.toMatch(
          /roles:\s*\[[^\]]*"USER"[^\]]*\]/,
        );
      },
    );

    it(
      "generates role restrictions for system settings menus",
      () => {
        const menuRuleSection =
          generatedConfig.match(
            /const menuFeatureRules:[\s\S]*?const tabFeatureRules:/,
          )?.[0];

        expect(
          menuRuleSection,
        ).toBeDefined();

        expect(
          menuRuleSection,
        ).toContain(
          'roles: ["EDITOR","ADMIN"]',
        );
      },
    );

    it(
      "generates role restrictions for system settings tabs",
      () => {
        const tabItemSection =
          generatedConfig.match(
            /const tabItems:[\s\S]*?const menuFeatureRules:/,
          )?.[0];

        expect(
          tabItemSection,
        ).toBeDefined();

        expect(
          tabItemSection,
        ).toContain(
          'roles: ["EDITOR","ADMIN"]',
        );
      },
    );

    it(
      "keeps the Data Analyzing runtime rule",
      () => {
        expect(
          generatedConfig,
        ).toContain(
          "featureID: 3000",
        );

        expect(
          generatedConfig,
        ).toContain(
          '3000: { type: "stateEquals", statePath: "execSettings.appliedStartAs", value: "SERVER_MASTER" }',
        );
      },
    );

    it(
      "combines Data Analyzing role and runtime restrictions",
      () => {
        const dataAnalyzingTab =
          generatedConfig.match(
            /\{\s*menuID:\s*\d+,\s*tabKey:\s*"data-analyzing",[\s\S]*?Content:\s*resolveApplicationScreen\("data-analyzing"\),\s*\}/,
          )?.[0];

        expect(
          dataAnalyzingTab,
        ).toBeDefined();

        expect(
          dataAnalyzingTab,
        ).toContain(
          "featureID: 3000",
        );

        expect(
          dataAnalyzingTab,
        ).toContain(
          'roles: ["EDITOR","ADMIN"]',
        );
      },
    );
  },
);
