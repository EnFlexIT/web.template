# Test Release

This document describes the current test-release workflow of `web.template`
and its relationship to frontend release-type detection.

The test-release workflow creates an Expo Web build, packages the generated
files, publishes the ZIP as a GitHub Actions artifact, and uploads the same ZIP
to a dedicated FTP test directory.

The architecture follows:

```text
Application --> Template --> Core
```

Build and deployment ownership must also be considered as the project moves
toward a Base Template repository with separate Application repositories.

---

## 1. Purpose

The test-release workflow provides a deployable web build for validation
before a production release.

Typical purposes include:

- Internal testing
- Frontend/backend compatibility validation
- Update-system testing
- Release-type testing
- UI validation
- Infrastructure validation
- Manual inspection of a generated release artifact

The test workflow is not intended to represent the final production release.

---

## 2. Current Workflow Files

The repository currently contains both release workflows:

```text
.github/workflows/export-put-release.yml
.github/workflows/export-put-test-release.yml
```

This document focuses on:

```text
.github/workflows/export-put-test-release.yml
```

Current GitHub Actions workflow name:

```text
Export Put Test Release
```

---

## 3. Trigger

The test-release workflow is started manually.

The workflow uses:

```yaml
on:
  workflow_dispatch:
```

This means a test build is created only when the workflow is explicitly
started through GitHub Actions.

There is currently no automatic branch or tag trigger in the test-release
workflow.

---

## 4. Runner

The current workflow runs on:

```text
ubuntu-latest
```

The job is currently named:

```text
install
```

---

## 5. Checkout

The workflow checks out the current repository using:

```yaml
uses: actions/checkout@v4
```

with:

```yaml
fetch-depth: 1
```

The workflow then prints basic repository information for diagnostics.

This includes information such as:

```text
GITHUB_SHA
current Git commit
current branch
repository files
package.json availability
package-lock.json availability
```

---

## 6. Node.js and npm

The current workflow uses:

```text
Node.js 20
```

through:

```yaml
uses: actions/setup-node@v4
```

with npm caching enabled.

The workflow then explicitly installs:

```text
npm 10
```

using:

```bash
npm install -g npm@10
```

The installed Node.js and npm versions are printed before the build
continues.

---

## 7. Dependency Validation

Dependencies are installed through:

```bash
npm ci
```

This is important for release builds because `npm ci` uses the committed
lockfile rather than changing dependency resolution.

The workflow also performs diagnostic checks for:

```text
package.json
package-lock.json
lockfile version
package name
package version
@floating-ui/dom
```

The `@floating-ui/dom` checks are currently diagnostic workflow steps rather
than architectural requirements.

---

## 8. Application Version

The release version is read directly from:

```text
package.json
```

The workflow executes:

```bash
node -p "require('./package.json').version"
```

The result becomes the workflow output:

```text
version
```

This value participates in the generated artifact name.

---

## 9. Timestamp

The workflow generates a timestamp using:

```bash
date +%Y%m%d-%H%M
```

The resulting format is:

```text
yyyyMMdd-HHmm
```

Example structure:

```text
20260810-1542
```

The timestamp is used in the artifact filename.

---

## 10. Web Export

The current workflow exports the Expo Web application with:

```bash
npx expo export -p web
```

Expo writes the exported web application to:

```text
dist/
```

The generated `dist` directory becomes the content of the release ZIP.

---

## 11. Important Configuration-Generation Note

The normal local npm lifecycle currently includes application-configuration
generation.

The project provides:

```text
npm run config:generate
```

and npm lifecycle hooks for normal startup commands.

However, the current GitHub test-release workflow calls Expo directly:

```bash
npx expo export -p web
```

This does not automatically execute npm lifecycle scripts such as `preweb`.

Therefore the current workflow depends on the required generated application
configuration already being present and current in the repository.

Conceptually:

```text
Current workflow

checkout repository
        |
        v
npm ci
        |
        v
npx expo export -p web
```

It does not currently perform:

```text
npm run config:generate
        |
        v
Expo export
```

This is a transitional build concern.

Before final Application-repository extraction, release workflows should
explicitly guarantee that application configuration is generated from the
Application-owned configuration source before the Expo export.

Do not silently assume that direct `npx expo export` performs this step.

---

## 12. Packaging

After the Expo export, the workflow packages the contents of:

```text
dist/
```

into a ZIP file.

The current artifact naming pattern is:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

The ZIP contains the exported web application contents rather than the
`dist` directory itself as an additional top-level folder.

Conceptually:

```text
dist/*
   |
   v
<PROJECT_NAME>_<version>_<timestamp>.zip
```

---

## 13. PROJECT_NAME

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
artifact name
```

The workflow itself does not hardcode the concrete project name.

---

## 14. GitHub Actions Artifact

The generated ZIP is uploaded as a GitHub Actions workflow artifact.

The workflow uses:

```yaml
actions/upload-artifact@v4
```

The artifact name is:

```text
<PROJECT_NAME>_<version>_<timestamp>
```

The uploaded file is:

```text
<PROJECT_NAME>_<version>_<timestamp>.zip
```

This allows the generated build to be inspected or downloaded from the
GitHub Actions run even independently of the FTP upload.

---

## 15. FTP Upload

The same ZIP file is uploaded to the configured FTP server.

The test target is:

```text
<PROJECT_PATH>/test
```

The workflow constructs:

```text
test_path = PROJECT_PATH/test
```

and uploads the generated ZIP there.

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
GitHub artifact     FTP /test directory
```

---

## 16. FTP Command

The workflow currently uses the command-line FTP client.

Conceptually, the command sequence is:

```text
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>/test
put <artifact>.zip
exit
```

The target test directory must be available on the FTP server.

The workflow does not currently create the directory.

---

## 17. Required GitHub Secrets

The current test workflow references these repository secrets:

| Secret | Purpose |
| --- | --- |
| `FTP_UPLOAD_URL` | FTP server address. |
| `FTP_USER` | FTP username. |
| `FTP_PSWD` | FTP password. |
| `PROJECT_NAME` | Prefix used for the generated artifact name. |
| `PROJECT_PATH` | Base FTP project directory. |

The workflow appends:

```text
/test
```

to `PROJECT_PATH`.

The secret is currently named:

```text
FTP_PSWD
```

Do not rename it in documentation without also changing the workflow.

---

## 18. Test Release Identification

The `/test` FTP directory identifies where the test artifact is deployed.

However, frontend release-type presentation is not determined merely from the
FTP directory.

The frontend obtains release-type information from the backend application
settings.

The relevant backend key is:

```text
_WebAppReleaseType
```

---

## 19. Release Types

The current frontend recognizes:

```ts
"PRODUCTION_RELEASE"
"TEST_RELEASE"
"UNKNOWN"
```

The reusable release state defines:

```text
WebAppReleaseType
```

under:

```text
src/template/state/release/appReleaseSlice.tsx
```

Release-type state belongs to Template because it supports reusable
application-shell presentation.

---

## 20. Release-Type Detection

Backend release-type detection is implemented in:

```text
src/core/server/serverCheck.ts
```

The server-check infrastructure reads:

```text
_WebAppReleaseType
```

from the backend application settings.

The current Core server implementation recognizes:

```text
TEST_RELEASE
PRODUCTION_RELEASE
```

and participates in normalizing the backend result.

This technical parsing belongs to Core because it is part of reusable backend
inspection.

---

## 21. Default Backend Result

The current server-check implementation contains fallback behavior for
`_WebAppReleaseType`.

The backend settings result is therefore normalized before being consumed by
Template release state.

Changes to release-type fallback behavior should be made centrally rather than
duplicated inside UI components.

---

## 22. Template Release State

Reusable release state lives at:

```text
src/template/state/release/appReleaseSlice.tsx
```

It stores the active frontend release classification.

The state recognizes:

```text
PRODUCTION_RELEASE
TEST_RELEASE
UNKNOWN
```

The slice also protects meaningful stored release information from being
unnecessarily overwritten by an `UNKNOWN` value.

Release state and technical backend parsing remain separate responsibilities.

Conceptually:

```text
Backend settings
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

---

## 23. Footer Presentation

The reusable footer is located at:

```text
src/template/components/layout/Footer.tsx
```

Release-related presentation such as a visible test-release indicator belongs
to reusable Template UI.

The footer is a consumer of application-shell state.

It must not implement backend settings parsing itself.

The responsibility remains:

```text
serverCheck        --> technical detection
appReleaseSlice    --> reusable state
Footer             --> presentation
```

---

## 24. Relevant Frontend Files

Current relevant files include:

| File | Purpose |
| --- | --- |
| `src/core/server/serverCheck.ts` | Reads and normalizes backend application settings including `_WebAppReleaseType`. |
| `src/template/state/release/appReleaseSlice.tsx` | Stores reusable frontend release-type state. |
| `src/template/components/layout/Footer.tsx` | Reusable application-shell location for release-related presentation. |

The old paths:

```text
src/screens/login/serverCheck.ts
src/components/Footer.tsx
```

are no longer the current architecture.

---

## 25. Architectural Ownership

Current ownership is:

```text
Core
|
+-- technical backend release-type parsing

Template
|
+-- release Redux state
+-- release-related reusable presentation

Application
|
+-- concrete build/deployment configuration
+-- product-specific release configuration
```

This ownership becomes increasingly important as concrete applications move
into separate repositories.

---

## 26. Future Application Repositories

The target architecture uses:

```text
Base Template repository
        |
        +-- Agent.Workbench Application repository
        +-- HEMS Application repository
        +-- future Application repositories
```

Concrete applications own their own build and deployment configuration.

Therefore workflows such as:

```text
export-put-test-release.yml
export-put-release.yml
```

should eventually be reviewed as Application-repository responsibilities.

The Base Template should provide reusable build capability and contracts, but
should not permanently own concrete product deployment destinations.

---

## 27. Current Repository Status

At the current migration stage, the workflows still exist inside
`web.template`.

That is acceptable during the transition.

Do not move the workflows before the concrete Application repositories and
their build contracts are ready.

The ownership distinction should be:

```text
Current physical location != final architectural owner
```

---

## 28. Test Release vs Production Release

The repository currently contains separate workflow files:

```text
export-put-test-release.yml
export-put-release.yml
```

The test workflow is verified to upload its ZIP to:

```text
<PROJECT_PATH>/test
```

This document does not assume additional production-workflow details that have
not been inspected.

For production behavior, inspect:

```text
.github/workflows/export-put-release.yml
```

before changing release documentation or workflow behavior.

---

## 29. When to Use the Test Workflow

Use the test-release workflow when:

- A frontend build should be validated before production.
- Update behavior needs to be tested.
- Frontend/backend compatibility should be checked.
- A release ZIP should be inspected.
- Release-type presentation needs validation.
- Infrastructure changes need a deployed test build.
- A build should be tested without using the production deployment target.

---

## 30. Test Artifact Naming

The test artifact currently uses the same general naming structure defined by
the workflow:

```text
<PROJECT_NAME>_<version>_<timestamp>.zip
```

The test character is expressed by the deployment target:

```text
<PROJECT_PATH>/test
```

There is currently no `-TEST` suffix added by the verified workflow.

If such a suffix is introduced later, update both:

```text
workflow
documentation
```

at the same time.

---

## 31. Troubleshooting: Build Failure

If the workflow fails before export, inspect:

```text
Node.js version
npm version
npm ci
package-lock.json
package.json
workflow logs
```

The workflow intentionally prints diagnostic package information before
building.

Do not change the lockfile from inside the release workflow.

---

## 32. Troubleshooting: Configuration Mismatch

If the exported application contains unexpected Application configuration,
check whether:

```text
src/application/config/application.properties
```

and the generated configuration are synchronized.

Because the current workflow directly runs:

```bash
npx expo export -p web
```

it does not currently guarantee a fresh `config:generate` step.

This should be reviewed before relying on properties-only changes in release
automation.

---

## 33. Troubleshooting: FTP Upload

If the GitHub workflow artifact exists but the FTP upload fails, the build and
packaging stages have already succeeded.

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

exists.

---

## 34. Troubleshooting: No Test Indicator

If a test release does not produce the expected frontend test indication,
check the backend application settings response for:

```text
_WebAppReleaseType
```

The expected test value is:

```text
TEST_RELEASE
```

Then inspect:

```text
src/core/server/serverCheck.ts
src/template/state/release/appReleaseSlice.tsx
src/template/components/layout/Footer.tsx
```

Do not implement a second release-type parser in the footer.

---

## 35. Troubleshooting: UNKNOWN State

If release state becomes:

```text
UNKNOWN
```

inspect the server-check result and Template release-state update.

The current slice contains protection intended to prevent `UNKNOWN` from
unnecessarily replacing previously meaningful `TEST_RELEASE` information.

Changes in this area should be tested together with server switching and
initialization.

---

## 36. Validation Workflow

After changing test-release infrastructure, validate the workflow file and
affected source references.

Useful searches include:

```bash
git grep -n "_WebAppReleaseType" -- src
git grep -n "TEST_RELEASE" -- src
git grep -n "PRODUCTION_RELEASE" -- src
git grep -n "appReleaseSlice" -- src test
```

Check the workflow:

```bash
git diff -- .github/workflows/export-put-test-release.yml
```

Validate source changes:

```bash
npx tsc --noEmit
```

Validate the patch:

```bash
git diff --check
```

When application configuration changes, also run:

```bash
npm run config:generate
```

before validating the local application.

---

## 37. Current Status

### Implemented

- Manual test-release workflow
- Node.js 20
- npm 10
- npm dependency caching
- `npm ci`
- Expo Web export
- ZIP packaging
- GitHub Actions artifact upload
- FTP test upload
- `/test` deployment target
- Backend `_WebAppReleaseType` parsing
- Template release state
- Reusable release-related presentation infrastructure

### Transitional

- Release workflows still live in `web.template`.
- Concrete deployment ownership has not yet moved to separate Application
  repositories.
- The test workflow directly uses `npx expo export -p web`.
- Application configuration generation is not explicitly executed in the
  current test workflow.
- Final reusable build contract between Application and Base Template is not
  yet defined.

### Planned

- Review release workflow ownership during Application-repository extraction.
- Make application configuration generation explicit in release builds.
- Keep technical release-type parsing reusable.
- Keep reusable release UI/state in Template.
- Move concrete product deployment configuration to Application repositories.
- Keep test and production deployment behavior clearly separated.

---

## 38. Architecture Rules

Release-related changes must preserve these rules:

1. Core must not import Template or Application.
2. Backend release-type parsing may remain reusable Core infrastructure.
3. Reusable release state belongs to Template.
4. Reusable release presentation belongs to Template.
5. Concrete product deployment configuration belongs to Application.
6. Release type must come from supported backend/application configuration,
   not from UI guesses.
7. The footer must not duplicate server-settings parsing.
8. Test deployment must remain separate from production deployment.
9. Build automation must eventually generate Application configuration
   explicitly.
10. Workflow documentation must reflect the actual committed workflow.
11. Do not document unverified production behavior as current fact.
12. Separate Application repositories must eventually own their concrete build
    and deployment pipelines.

---

## 39. Success Criteria

The test-release architecture is successful when:

1. The committed workflow and documentation match.
2. Test builds are reproducible through `npm ci`.
3. Application configuration is guaranteed to be current before export.
4. Test artifacts remain separate from production artifacts.
5. Backend release type is parsed in one reusable technical location.
6. Template presentation consumes release state without duplicating parsing.
7. Concrete Application repositories can own their deployment configuration.
8. The Base Template remains reusable and independent from a concrete FTP
   deployment target.