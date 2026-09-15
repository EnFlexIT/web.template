# Release Workflow

## Purpose

This document describes the current production release workflow of `web.template`.

The workflow:

* builds the Expo web application
* packages the exported files as a ZIP archive
* uploads the archive to the configured FTP target
* creates a GitHub release

The architecture follows:

```text
Application --> Template --> Core
```

Standard Agent.Workbench functionality belongs to the Base Template.

Concrete consumer Applications such as HEMS may own their own product-specific build and deployment configuration.

---

# 1. Workflow File

The production release workflow is defined in:

```text
.github/workflows/export-put-release.yml
```

The documented workflow name is:

```text
Export Put Release
```

It is started manually through:

```yaml
workflow_dispatch
```

A production release is therefore not automatically created on every push.

The committed workflow file is authoritative.

---

# 2. Current Workflow Overview

The documented production workflow performs:

```text
Checkout repository
        |
        v
Show Git information
        |
        v
Setup Node.js 20
        |
        v
Install npm 10
        |
        v
Show Node/npm versions
        |
        v
Show package diagnostics
        |
        v
npm ci
        |
        v
Read package version
        |
        v
Generate timestamp
        |
        v
Expo web export
        |
        v
ZIP package
        |
        v
FTP upload
        |
        v
GitHub release
```

---

# 3. Checkout

The workflow uses:

```yaml
actions/checkout@v4
```

with:

```yaml
fetch-depth: 1
```

The workflow also prints Git information for diagnostics.

Examples include:

```text
GITHUB_SHA
current commit
current branch
repository file listing
package.json presence
package-lock.json presence
```

These diagnostics help identify release-context problems.

---

# 4. Node.js and npm

The documented workflow uses:

```text
Node.js 20
npm 10
```

Node is configured through:

```yaml
actions/setup-node@v4
```

with npm caching enabled.

npm is then explicitly updated using:

```bash
npm install -g npm@10
```

The active Node.js and npm versions are printed during the workflow.

---

# 5. Dependency Installation

Dependencies are installed using:

```bash
npm ci
```

This requires a valid and synchronized:

```text
package.json
package-lock.json
```

If the lockfile does not match the package definition, the workflow fails during installation.

---

# 6. Package Diagnostics

The workflow may print package diagnostics such as:

```text
@floating-ui/dom references
lockfile version
package name
package version
```

These diagnostics are useful for troubleshooting.

They are not part of the release artifact.

---

# 7. Version

The release version is read from:

```text
package.json
```

using:

```bash
node -p "require('./package.json').version"
```

Example:

```text
0.0.4
```

The version is used for artifact naming and the GitHub release tag.

---

# 8. Timestamp

The workflow generates a timestamp using:

```bash
date +%Y%m%d-%H%M
```

Example:

```text
20260811-0915
```

The timestamp is included in the release archive filename.

---

# 9. Current Build Command

The documented production export uses:

```bash
npx expo export -p web
```

Expo writes the generated web application to:

```text
dist/
```

---

# 10. Application Configuration

Developer-facing Application configuration is stored under:

```text
src/application/config/
```

The current configuration files are:

```text
application.properties
features.properties
navigation.properties
```

Generated runtime artifacts are written under:

```text
src/application/generated/
```

Configuration generation is executed with:

```bash
npm run config:generate
```

---

# 11. Configuration Generation and Release Builds

Normal npm runtime commands such as:

```text
npm start
npm run web
npm run android
npm run ios
```

may execute configuration generation through npm lifecycle hooks.

The production release workflow instead directly executes:

```bash
npx expo export -p web
```

Direct Expo execution does not automatically imply that npm lifecycle generation hooks have run.

Therefore release automation should explicitly guarantee current generated Application configuration before export.

The desired sequence is:

```text
npm ci
    |
    v
npm run config:generate
    |
    v
npx expo export -p web
```

If the committed workflow does not yet contain this generation step, it remains a deterministic-build improvement.

---

# 12. Why Explicit Generation Matters

The source of truth for developer-facing configuration is:

```text
application.properties
features.properties
navigation.properties
```

Generated TypeScript is build/runtime output.

Therefore:

```text
Application .properties
        |
        v
config:generate
        |
        v
generated runtime configuration
        |
        v
Expo export
```

is preferable to relying on previously generated files being current.

---

# 13. Configuration Generator

Configuration tooling lives under:

```text
src/template/config/build/
```

A central generator is:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The tooling supports the Application/Template integration contract.

Future concrete consumer repositories may require configurable input/output paths.

Such changes should be driven by real consumer integration requirements.

---

# 14. Packaging

After the Expo export, the contents of:

```text
dist/
```

are packaged into a ZIP archive.

The documented naming pattern is:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

Example:

```text
Agent.Workbench_0.0.4_20260811-0915.zip
```

The example name reflects the configured `PROJECT_NAME`.

It does not imply that Agent.Workbench is a separate concrete Application.

---

# 15. PROJECT_NAME

The archive prefix is supplied through the repository secret:

```text
PROJECT_NAME
```

Conceptually:

```text
PROJECT_NAME
    +
package.version
    +
timestamp
    =
release archive filename
```

The workflow therefore does not need to hardcode a product name into the release script.

---

# 16. FTP Upload

The ZIP archive is uploaded through FTP.

The configured production target is:

```text
<PROJECT_PATH>
```

Conceptually:

```text
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>
put <archive>.zip
exit
```

The target directory must exist unless the workflow explicitly creates it.

---

# 17. Required Repository Secrets

The documented workflow uses:

| Secret           | Purpose                |
| ---------------- | ---------------------- |
| `FTP_UPLOAD_URL` | FTP server address     |
| `FTP_USER`       | FTP username           |
| `FTP_PSWD`       | FTP password           |
| `PROJECT_NAME`   | Release archive prefix |
| `PROJECT_PATH`   | FTP production target  |

The secret name:

```text
FTP_PSWD
```

must remain consistent with the workflow.

---

# 18. GitHub Release

After FTP upload, the workflow creates a GitHub release through:

```text
softprops/action-gh-release@v2
```

The generated ZIP archive is attached to the release.

The tag name is:

```text
v<package.version>
```

Example:

```text
v0.0.4
```

---

# 19. Duplicate Version Risk

The GitHub release tag is derived from:

```text
package.version
```

The archive filename also contains a timestamp, but the Git tag does not.

Therefore multiple production releases with the same package version may conflict with an existing tag/release.

The package version should be reviewed before starting a production release.

---

# 20. Production vs Test Release

The production workflow uploads to:

```text
<PROJECT_PATH>
```

The test-release workflow is documented separately in:

```text
doc/test-release.md
```

The test path must remain distinct from the production path.

Production and test release behavior should not be conflated.

---

# 21. Release Architecture Ownership

Release-related ownership follows:

```text
Core
|
+-- reusable technical capabilities only

Template
|
+-- reusable release state/presentation where applicable
+-- reusable build integration where appropriate
+-- standard Agent.Workbench frontend behavior

Application
|
+-- concrete consumer-specific build configuration
+-- concrete consumer-specific deployment configuration
+-- concrete product infrastructure
```

Standard Agent.Workbench functionality remains part of the Base Template.

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

---

# 22. Current web.template Release Workflow

The release workflow currently lives in:

```text
web.template
```

This is valid because `web.template` remains:

* runnable
* testable
* deployable
* the owner of the Base Template
* the owner of standard Agent.Workbench functionality

Its current release workflow does not imply that Agent.Workbench requires its own separate Application repository.

---

# 23. Concrete Consumer Release Ownership

A future concrete consumer such as HEMS may own its own:

```text
HEMS build workflow
HEMS deployment destination
HEMS product infrastructure
HEMS release configuration
```

Conceptually:

```text
HEMS Repository
|
+-- Application configuration
+-- Application screens
+-- product state
+-- product business logic
+-- build workflow
+-- deployment workflow
```

and consume:

```text
web.template
|
+-- Template
+-- Core
```

The Base Template must not depend on HEMS deployment details.

---

# 24. No Separate Agent.Workbench Release Repository

The previous architecture assumed:

```text
Agent.Workbench Application Repository
```

with an independent extracted release pipeline.

That is not part of the accepted architecture.

The correct ownership is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

Therefore future repository separation should focus on real concrete consumers such as HEMS, not on extracting Agent.Workbench from the Base Template.

---

# 25. Current Status

## Implemented

```text
manual production release
Node.js 20
npm 10
npm ci
Expo web export
ZIP packaging
FTP upload
GitHub release
package-version based release tag
timestamped archive naming
```

## Current Review Item

The important remaining release-workflow review item is:

```text
ensure npm run config:generate executes explicitly
before Expo export
```

This is a deterministic-build concern.

It is not an Agent.Workbench extraction concern.

## Future Consumer Work

Future concrete Applications may require:

```text
consumer-specific build workflows
consumer-specific deployment destinations
consumer release configuration
consumer infrastructure configuration
```

HEMS is an example of such a concrete consumer.

---

# 26. Troubleshooting: npm ci

If `npm ci` fails, possible causes include:

```text
package-lock.json is missing
package-lock.json is outdated
package.json and package-lock.json differ
dependency metadata is inconsistent
```

Typical local repair flow:

```bash
npm install
```

Then review:

```bash
git diff -- package.json package-lock.json
```

Do not commit dependency changes without reviewing them.

---

# 27. Troubleshooting: Application Configuration

If the exported Application contains unexpected configuration, inspect:

```text
src/application/config/application.properties
src/application/config/features.properties
src/application/config/navigation.properties
```

and:

```text
src/application/generated/
```

Regenerate with:

```bash
npm run config:generate
```

The developer-facing `.properties` files are authoritative.

Generated files must not silently override stale configuration.

---

# 28. Troubleshooting: FTP Upload

If build/package steps succeed but FTP upload fails, verify:

```text
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_PATH
PROJECT_NAME
FTP server availability
FTP target directory
```

Also inspect the workflow logs.

---

# 29. Troubleshooting: GitHub Release

If the GitHub release step fails, verify:

```text
package.json version
existing Git tags
existing GitHub releases
repository permissions
```

A previously existing:

```text
v<package.version>
```

tag may conflict with the new release.

---

# 30. Validation Before Production Release

Before creating a production release, run:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
```

Also verify:

```bash
git diff --check
git status --short
```

The release should be created from a known and reviewed Git state.

---

# 31. Workflow Validation

When the production workflow itself changes, inspect:

```bash
git diff -- .github/workflows/export-put-release.yml
```

Verify that documentation still matches the committed YAML.

Do not document unverified release behavior as implemented.

---

# 32. Architecture Rules

Release-related work must preserve:

1. `Application --> Template --> Core`.
2. Core must not import Template or Application.
3. Standard Agent.Workbench functionality belongs to Template.
4. Agent.Workbench does not require a separate Application repository.
5. Concrete consumer build/deployment configuration belongs to the concrete consumer.
6. HEMS-specific deployment belongs to HEMS.
7. Application configuration generation should be deterministic before export.
8. Release documentation must match the committed workflow.
9. Generated configuration must not be treated as more authoritative than `.properties`.
10. Production and test deployment targets must remain distinguishable.
11. Template must not depend on consumer deployment details.
12. Future release separation should be validated through a real concrete consumer.

---

# 33. Incorrect Legacy Statements

The following statements do not describe the accepted architecture:

```text
"The architecture is transitioning toward a separate Agent.Workbench repository."

"Agent.Workbench must own an independent Application release workflow."

"web.template only temporarily owns the Agent.Workbench release."

"Agent.Workbench and HEMS require equivalent consumer repositories."

"Agent.Workbench release extraction is still pending."
```

The correct model is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS and future concrete products
    -> Application
```

---

# 34. Summary

The current production pipeline is:

```text
GitHub Actions
      |
      v
npm ci
      |
      v
Application configuration generation
      |
      v
Expo web export
      |
      v
dist/
      |
      v
ZIP
      |
      +------> FTP
      |
      +------> GitHub Release
```

If the committed workflow does not yet explicitly execute:

```bash
npm run config:generate
```

before:

```bash
npx expo export -p web
```

that remains the main deterministic-build improvement.

The architectural ownership is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

A separate Agent.Workbench Application/release repository is not part of the accepted architecture.
