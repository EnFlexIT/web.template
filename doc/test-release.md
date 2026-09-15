# Test Release

## Purpose

This document describes the current test-release workflow of `web.template` and its relationship to frontend release-type detection.

The test-release workflow:

* creates an Expo Web export
* packages the generated files
* publishes the ZIP as a GitHub Actions artifact
* uploads the same ZIP to a dedicated FTP test directory

The architecture follows:

```text
Application --> Template --> Core
```

Standard Agent.Workbench functionality belongs to the Base Template.

Concrete consumer Applications such as HEMS may own their own product-specific build and deployment configuration.

---

# 1. Test Release Purpose

The test-release workflow provides a deployable web build for validation before a production release.

Typical purposes include:

* internal testing
* frontend/backend compatibility validation
* update-system testing
* release-type testing
* UI validation
* infrastructure validation
* manual inspection of a generated release artifact

The test workflow is not intended to represent the final production release.

---

# 2. Workflow Files

The repository currently contains release workflows including:

```text
.github/workflows/export-put-release.yml
.github/workflows/export-put-test-release.yml
```

This document focuses on:

```text
.github/workflows/export-put-test-release.yml
```

The documented GitHub Actions workflow name is:

```text
Export Put Test Release
```

Workflow behavior should always be verified against the committed YAML before changing release documentation.

---

# 3. Trigger

The test-release workflow is manually triggered through:

```yaml
on:
  workflow_dispatch:
```

This means the test release is explicitly started through GitHub Actions.

The documented workflow does not use an automatic branch or tag trigger for the test release.

---

# 4. Runner

The documented workflow runs on:

```text
ubuntu-latest
```

The current job is documented as:

```text
install
```

---

# 5. Repository Checkout

The workflow checks out the repository using:

```yaml
uses: actions/checkout@v4
```

with:

```yaml
fetch-depth: 1
```

The workflow also prints repository information for diagnostics.

Examples include:

```text
GITHUB_SHA
current Git commit
current branch
repository files
package.json availability
package-lock.json availability
```

These diagnostic steps help identify build-context problems.

---

# 6. Node.js and npm

The documented workflow uses:

```text
Node.js 20
```

through:

```yaml
uses: actions/setup-node@v4
```

with npm caching enabled.

The workflow then installs:

```text
npm 10
```

using:

```bash
npm install -g npm@10
```

The active Node.js and npm versions are printed before the build continues.

---

# 7. Dependency Installation

Dependencies are installed using:

```bash
npm ci
```

This is appropriate for release automation because it uses the committed lockfile instead of recalculating dependency resolution.

The workflow also contains diagnostic checks for package and lockfile information.

Observed diagnostics include areas such as:

```text
package.json
package-lock.json
lockfile version
package name
package version
@floating-ui/dom
```

These checks are workflow diagnostics and not architectural requirements.

---

# 8. Application Version

The release version is read from:

```text
package.json
```

using:

```bash
node -p "require('./package.json').version"
```

The result is used as the workflow version value and participates in artifact naming.

---

# 9. Timestamp

The workflow creates a timestamp using:

```bash
date +%Y%m%d-%H%M
```

Format:

```text
yyyyMMdd-HHmm
```

Example:

```text
20260810-1542
```

The timestamp participates in the generated artifact filename.

---

# 10. Web Export

The documented workflow exports the Expo Web application using:

```bash
npx expo export -p web
```

Expo writes the exported web application to:

```text
dist/
```

The contents of `dist/` are then packaged into the release ZIP.

---

# 11. Application Configuration Generation

Developer-facing Application configuration uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

The project provides:

```bash
npm run config:generate
```

Generated runtime artifacts are written under:

```text
src/application/generated/
```

The normal development lifecycle uses configuration generation before Application startup.

However, the documented test-release workflow directly executes:

```bash
npx expo export -p web
```

Therefore the release workflow must not assume that normal npm startup lifecycle hooks automatically regenerate Application configuration.

The desired deterministic release sequence is:

```text
checkout
    |
    v
npm ci
    |
    v
npm run config:generate
    |
    v
npx expo export -p web
```

If the current workflow does not explicitly contain the `config:generate` step, this remains a release-workflow improvement that should be addressed before relying on configuration-only changes in automated releases.

---

# 12. Why Explicit Generation Matters

The developer-facing configuration source is the `.properties` configuration.

Generated TypeScript is build/runtime output.

Release automation should therefore produce generated artifacts from the committed configuration source instead of relying on previously generated files being current.

Conceptually:

```text
Application .properties
        |
        v
config:generate
        |
        v
generated runtime artifacts
        |
        v
Expo export
```

This keeps release builds deterministic.

---

# 13. Packaging

After the Expo export, the workflow packages the contents of:

```text
dist/
```

into a ZIP file.

The documented naming pattern is:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

The ZIP contains the exported web application contents rather than introducing `dist/` as an additional top-level directory.

Conceptually:

```text
dist/*
   |
   v
<PROJECT_NAME>_<version>_<timestamp>.zip
```

---

# 14. PROJECT_NAME

The artifact name uses the GitHub repository secret:

```text
PROJECT_NAME
```

Conceptually:

```text
PROJECT_NAME
    +
package.json version
    +
timestamp
    =
artifact filename
```

The workflow therefore does not need to hardcode the project name directly into the artifact name.

---

# 15. GitHub Actions Artifact

The generated ZIP is uploaded as a GitHub Actions artifact.

The documented workflow uses:

```yaml
actions/upload-artifact@v4
```

The artifact name follows:

```text
<PROJECT_NAME>_<version>_<timestamp>
```

The uploaded ZIP is:

```text
<PROJECT_NAME>_<version>_<timestamp>.zip
```

This allows the test build to be inspected independently from the FTP deployment.

---

# 16. FTP Upload

The same ZIP is uploaded to the configured FTP server.

The test target is:

```text
<PROJECT_PATH>/test
```

Conceptually:

```text
GitHub Actions
      |
      v
generated ZIP
      |
      +------------------+
      |                  |
      v                  v
GitHub artifact     FTP test directory
```

The target test directory must exist on the FTP server unless the workflow explicitly creates it.

---

# 17. FTP Command

The workflow uses the command-line FTP client.

Conceptually:

```text
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>/test
put <artifact>.zip
exit
```

The workflow should not expose credential values in logs.

---

# 18. Required GitHub Secrets

The documented test workflow references:

| Secret           | Purpose                    |
| ---------------- | -------------------------- |
| `FTP_UPLOAD_URL` | FTP server address         |
| `FTP_USER`       | FTP username               |
| `FTP_PSWD`       | FTP password               |
| `PROJECT_NAME`   | Prefix for artifact naming |
| `PROJECT_PATH`   | Base FTP project directory |

The test workflow appends:

```text
/test
```

to `PROJECT_PATH`.

The secret name:

```text
FTP_PSWD
```

must not be renamed in documentation unless the workflow is changed at the same time.

---

# 19. Test Deployment and Release Type

The FTP `/test` path determines where the test artifact is uploaded.

Frontend release-type presentation is a separate concern.

The frontend receives release-type information from backend application settings.

Relevant backend key:

```text
_WebAppReleaseType
```

The deployment directory must not become a second independent frontend release-type detection mechanism.

---

# 20. Release Types

The documented frontend release states are:

```text
PRODUCTION_RELEASE
TEST_RELEASE
UNKNOWN
```

Reusable release state is represented by:

```text
WebAppReleaseType
```

under:

```text
src/template/state/release/appReleaseSlice.tsx
```

Release state belongs to Template because it supports reusable application-shell behavior.

---

# 21. Release-Type Detection

Technical backend release-type parsing is implemented in:

```text
src/core/server/serverCheck.ts
```

The server-check infrastructure reads:

```text
_WebAppReleaseType
```

from backend application settings.

The documented recognized values include:

```text
TEST_RELEASE
PRODUCTION_RELEASE
```

Technical parsing belongs to Core because it is reusable backend inspection behavior.

---

# 22. Template Release State

Reusable release state exists at:

```text
src/template/state/release/appReleaseSlice.tsx
```

The state handles the normalized release classification used by reusable Template presentation.

Conceptually:

```text
Backend application settings
        |
        v
Core serverCheck
        |
        v
Template release state
        |
        v
Template presentation
```

Technical parsing and UI state remain separate responsibilities.

---

# 23. UNKNOWN Release State

The Template release state also supports:

```text
UNKNOWN
```

The current implementation should be inspected before changing fallback or overwrite behavior.

Release-type fallback logic should remain centralized rather than being duplicated inside presentation components.

Changes should be tested together with server switching and initialization behavior.

---

# 24. Footer Presentation

Reusable footer presentation exists at:

```text
src/template/components/layout/Footer.tsx
```

Release-related UI such as a test-release indicator belongs to Template presentation.

The footer consumes normalized state.

It must not parse backend settings directly.

Responsibility remains:

```text
serverCheck
    -> technical detection

appReleaseSlice
    -> reusable state

Footer
    -> presentation
```

---

# 25. Release Architecture Ownership

Release-related architecture follows:

```text
Core
|
+-- technical backend release-type parsing

Template
|
+-- reusable release Redux state
+-- reusable release presentation

Application
|
+-- concrete consumer build configuration
+-- concrete consumer deployment configuration
+-- product-specific release settings where required
```

Standard Agent.Workbench frontend behavior remains part of Template.

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

---

# 26. Build and Deployment Ownership

Concrete consumer Applications should own their product-specific build and deployment configuration.

For example, a future HEMS repository may own:

```text
HEMS release configuration
HEMS deployment destination
HEMS product infrastructure
HEMS build workflow
```

The Base Template may provide reusable build mechanisms and integration contracts.

It should not need to know a concrete consumer's deployment target.

---

# 27. Current web.template Workflow

The release workflows currently live inside `web.template`.

This is valid for the current repository because `web.template` also contains the in-repository Agent.Workbench Application composition and standard Agent.Workbench Base Template functionality.

Their current physical location does not imply that future concrete consumer repositories such as HEMS must share the same deployment configuration.

Future consumer build ownership should be validated when a real consumer repository is integrated.

---

# 28. No Separate Agent.Workbench Release Repository

The previous architecture assumed a future:

```text
Agent.Workbench Application repository
```

with its own extracted product build and deployment workflow.

That is no longer the selected architecture.

Standard Agent.Workbench functionality belongs to the Base Template.

Therefore the architecture does not require a separate Agent.Workbench consumer repository solely for release ownership.

Future release separation work should focus on concrete consumers such as HEMS.

---

# 29. Test Release vs Production Release

The repository contains:

```text
.github/workflows/export-put-test-release.yml
.github/workflows/export-put-release.yml
```

The documented test workflow uploads to:

```text
<PROJECT_PATH>/test
```

Production behavior must be verified against:

```text
.github/workflows/export-put-release.yml
```

before documenting or changing production-release behavior.

Do not infer unverified production behavior from the test workflow.

---

# 30. When to Use the Test Workflow

Use the test-release workflow when:

* a frontend build should be validated before production
* update behavior needs testing
* frontend/backend compatibility should be checked
* a release ZIP should be inspected
* release-type presentation needs validation
* infrastructure changes need a deployed test build
* testing should occur without using the production deployment target

---

# 31. Artifact Naming

The documented artifact naming structure is:

```text
<PROJECT_NAME>_<version>_<timestamp>.zip
```

The test nature of the deployment is represented by:

```text
<PROJECT_PATH>/test
```

The documented workflow does not add a `-TEST` suffix to the ZIP name.

If artifact naming changes, update workflow and documentation together.

---

# 32. Troubleshooting: Build Failure

If the workflow fails before export, inspect:

```text
Node.js version
npm version
npm ci
package-lock.json
package.json
workflow logs
```

Do not change dependency resolution from inside the release workflow merely to make a release succeed.

Dependency fixes belong in the repository and lockfile.

---

# 33. Troubleshooting: Configuration Mismatch

If the exported Application contains unexpected configuration, inspect:

```text
src/application/config/application.properties
src/application/config/features.properties
src/application/config/navigation.properties
```

and generated artifacts under:

```text
src/application/generated/
```

Then verify whether the release workflow ran:

```bash
npm run config:generate
```

before Expo export.

A stale generated file must not be treated as authoritative over the developer-facing `.properties` configuration.

---

# 34. Troubleshooting: FTP Upload

If the GitHub Actions artifact exists but FTP upload fails, then build and packaging have already succeeded.

Check:

```text
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_PATH
FTP server availability
FTP target directory
workflow logs
```

Also verify that:

```text
<PROJECT_PATH>/test
```

exists or is created by the workflow.

---

# 35. Troubleshooting: Missing Test Indicator

If a test deployment does not produce the expected frontend test indicator, inspect the backend application settings for:

```text
_WebAppReleaseType
```

Expected test value:

```text
TEST_RELEASE
```

Then inspect:

```text
src/core/server/serverCheck.ts
src/template/state/release/appReleaseSlice.tsx
src/template/components/layout/Footer.tsx
```

Do not add a second release-type parser in the footer.

---

# 36. Validation

After changing release infrastructure, validate relevant source and workflow references.

Useful searches:

```bash
git grep -n "_WebAppReleaseType" -- src
git grep -n "TEST_RELEASE" -- src
git grep -n "PRODUCTION_RELEASE" -- src
git grep -n "appReleaseSlice" -- src test
```

Inspect workflow changes:

```bash
git diff -- .github/workflows/export-put-test-release.yml
```

Run Application configuration generation:

```bash
npm run config:generate
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run affected tests:

```bash
npm test -- --runInBand
```

Validate the patch:

```bash
git diff --check
git status --short
```

---

# 37. Current Status

## Implemented

The documented test-release workflow includes:

```text
manual workflow trigger
Node.js 20
npm 10
npm caching
npm ci
Expo Web export
ZIP packaging
GitHub Actions artifact upload
FTP test upload
/test deployment target
backend _WebAppReleaseType parsing
Template release state
reusable release presentation
```

## Current Review Item

The key current release-workflow review item is:

```text
ensure npm run config:generate executes explicitly
before Expo export
```

This is a deterministic-build concern.

It is not an Agent.Workbench extraction concern.

## Future Consumer Work

Future concrete consumer Applications may require:

```text
consumer-specific build workflows
consumer-specific deployment destinations
consumer release configuration
consumer infrastructure configuration
```

HEMS is an example of such a future consumer.

---

# 38. Architecture Rules

Release-related work must preserve:

1. `Application --> Template --> Core`.
2. Core must not import Template or Application.
3. Backend release-type parsing may remain reusable Core functionality.
4. Reusable release state belongs to Template.
5. Reusable release presentation belongs to Template.
6. Standard Agent.Workbench functionality belongs to Template.
7. HEMS-specific deployment configuration belongs to HEMS.
8. Release-type UI must consume normalized state instead of parsing backend settings independently.
9. Test and production deployment targets must remain distinguishable.
10. Application configuration generation should be deterministic before export.
11. Workflow documentation must match the committed workflow.
12. Unverified production behavior must not be documented as fact.
13. Future concrete consumer repositories may own their own build/deployment pipelines.
14. A separate Agent.Workbench Application repository is not required.

---

# 39. Incorrect Legacy Statements

The following statements are no longer correct:

```text
"Agent.Workbench is a concrete Application repository."

"Agent.Workbench must eventually own a separate release pipeline."

"Release workflow ownership requires Agent.Workbench extraction."

"web.template is only temporarily responsible for Agent.Workbench releases."

"Agent.Workbench and HEMS must have equivalent consumer repositories."
```

The correct architecture is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

---

# 40. Success Criteria

The test-release architecture is correct when:

1. The committed workflow and documentation match.
2. Test builds use deterministic dependency installation.
3. Application configuration is generated explicitly before export.
4. Test artifacts remain separate from production deployment.
5. Backend release type is parsed in one reusable technical location.
6. Template state consumes normalized release information.
7. Presentation does not duplicate backend parsing.
8. Standard Agent.Workbench release presentation remains Template-owned.
9. Concrete consumers such as HEMS can own their own deployment configuration.
10. The Base Template does not depend on HEMS deployment details.
11. Workflow secrets remain documented consistently with the workflow.
12. Architecture remains consistent with `Application --> Template --> Core`.

---

# 41. Summary

The test-release workflow currently builds and deploys the web frontend for validation.

The architectural ownership is:

```text
Core
    technical release-type parsing

Template
    reusable release state
    reusable release presentation
    standard Agent.Workbench frontend behavior

Application
    concrete consumer build/deployment configuration
```

The most important current workflow improvement is to ensure that:

```bash
npm run config:generate
```

runs explicitly before:

```bash
npx expo export -p web
```

when that step is not already present in the committed workflow.

This keeps generated Application configuration deterministic.

A future HEMS consumer may own its own release pipeline.

A separate Agent.Workbench Application repository is not part of the current architecture.
