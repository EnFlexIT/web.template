import fs from "node:fs";
import path from "node:path";

function parseProperties(content) {
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

    if (
      Object.hasOwn(
        properties,
        key,
      )
    ) {
      throw new Error(
        `Duplicate property key: "${key}".`,
      );
    }

    properties[key] =
      value;
  }

  return properties;
}

function requireValue(
  value,
  description,
) {
  const normalized =
    String(
      value ?? "",
    ).trim();

  if (!normalized) {
    throw new Error(
      `Missing required build metadata: ${description}.`,
    );
  }

  return normalized;
}

function optionalValue(
  value,
) {
  const normalized =
    String(
      value ?? "",
    ).trim();

  return (
    normalized ||
    undefined
  );
}

function optionalReleaseNotes(
  value,
) {
  const normalized =
    optionalValue(value);

  if (!normalized) {
    return undefined;
  }

  const notes =
    normalized
      .split(/\r?\n/)
      .map((note) =>
        note.trim(),
      )
      .filter(Boolean);

  return (
    notes.length > 0
      ? notes
      : undefined
  );
}


function readTemplateReleaseNotes(
  templateMetadata,
) {
  const notes =
    Object.entries(
      templateMetadata,
    )
      .map(
        ([key, value]) => {
          const match =
            /^TemplateReleaseNote\.(\d+)$/.exec(
              key,
            );

          if (!match) {
            return undefined;
          }

          const note =
            optionalValue(value);

          if (!note) {
            return undefined;
          }

          return {
            index:
              Number(match[1]),

            note,
          };
        },
      )
      .filter(Boolean)
      .sort(
        (left, right) =>
          left.index -
          right.index,
      )
      .map(
        (entry) =>
          entry.note,
      );

  return (
    notes.length > 0
      ? notes
      : undefined
  );
}

function readPackageJson(
  rootDirectory,
) {
  const packageJsonPath =
    path.join(
      rootDirectory,
      "package.json",
    );

  if (
    !fs.existsSync(
      packageJsonPath,
    )
  ) {
    throw new Error(
      `package.json does not exist: ${packageJsonPath}`,
    );
  }

  return JSON.parse(
    fs.readFileSync(
      packageJsonPath,
      "utf8",
    ),
  );
}

function readTemplateMetadata(
  rootDirectory,
) {
  const templatePropertiesPath =
    path.join(
      rootDirectory,
      "src",
      "template",
      "config",
      "template.properties",
    );

  if (
    !fs.existsSync(
      templatePropertiesPath,
    )
  ) {
    throw new Error(
      `Template metadata does not exist: ${templatePropertiesPath}`,
    );
  }

  return parseProperties(
    fs.readFileSync(
      templatePropertiesPath,
      "utf8",
    ),
  );
}

export function generateApplicationBuildInfo(
  rootDirectory,
) {
  const packageJson =
    readPackageJson(
      rootDirectory,
    );

  const templateMetadata =
    readTemplateMetadata(
      rootDirectory,
    );

  const packageName =
    requireValue(
      packageJson.name,
      "package.json name",
    );

  const packageVersion =
    requireValue(
      packageJson.version,
      "package.json version",
    );

  const templatePackageName =
    requireValue(
      templateMetadata.TemplatePackageName,
      "TemplatePackageName",
    );

  const templateVersion =
    requireValue(
      templateMetadata.TemplateVersion,
      "TemplateVersion",
    );

  const isTemplateRepository =
    packageName ===
    templatePackageName;

  /*
   * Release-specific values are injected only by
   * the real release/build pipeline.
   *
   * Normal local config generation intentionally
   * leaves them undefined. This keeps
   * `npm run config:generate` deterministic.
   */
  const applicationReleaseTag =
    optionalValue(
      process.env
        .ENFLEX_APPLICATION_RELEASE_TAG,
    );

  const buildTimestamp =
    optionalValue(
      process.env
        .ENFLEX_BUILD_TIMESTAMP,
    );

  const commitSha =
    optionalValue(
      process.env
        .ENFLEX_APPLICATION_COMMIT_SHA,
    );

  const configuredApplicationReleaseNotes =
    optionalReleaseNotes(
      process.env
        .ENFLEX_APPLICATION_RELEASE_NOTES,
    );

  const configuredTemplateReleaseNotes =
    optionalReleaseNotes(
      process.env
        .ENFLEX_TEMPLATE_RELEASE_NOTES,
    );

  const storedTemplateReleaseNotes =
    readTemplateReleaseNotes(
      templateMetadata,
    );

  /*
   * The Template repository itself historically uses the
   * Application release-notes environment variable as well.
   *
   * Keep that behaviour compatible, but classify those notes
   * as Template notes when this repository is the Base Template.
   */
  const applicationReleaseNotes =
    isTemplateRepository
      ? undefined
      : configuredApplicationReleaseNotes;

  const templateReleaseNotes =
    configuredTemplateReleaseNotes ??
    storedTemplateReleaseNotes ??
    (
      isTemplateRepository
        ? configuredApplicationReleaseNotes
        : undefined
    );

  const application = {
    packageName:
      isTemplateRepository
        ? undefined
        : packageName,

    version:
      isTemplateRepository
        ? undefined
        : packageVersion,

    releaseTag:
      isTemplateRepository
        ? undefined
        : applicationReleaseTag,
  };

  const template = {
    packageName:
      templatePackageName,

    version:
      templateVersion,
  };

  const build =
    buildTimestamp ||
    commitSha
      ? {
          timestamp:
            buildTimestamp,

          commitSha,
        }
      : undefined;

  const release =
    applicationReleaseNotes ||
    templateReleaseNotes
      ? {
          notes:
            applicationReleaseNotes,

          templateNotes:
            templateReleaseNotes,
        }
      : undefined;

  return {
    application,
    template,
    build,
    release,
  };
}

export function writeGeneratedApplicationBuildInfo(
  rootDirectory,
  buildInfo,
) {
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
      "applicationBuildInfo.generated.ts",
    );

  const generatedContent = `
// This file is generated automatically.
// Do not edit this file manually.

export const applicationBuildInfo =
${JSON.stringify(
  buildInfo,
  null,
  2,
)} as const;
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
}