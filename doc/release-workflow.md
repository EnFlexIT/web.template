# Release Workflow

## Purpose

This document describes the current production release workflow of
`web.template`.

The workflow builds the Expo web application, packages the exported files as a
ZIP archive, uploads the archive to the configured FTP target and creates a
GitHub release.

This document describes the current implementation.

The architecture is currently transitioning toward separate Application
repositories.

---

# 1. Workflow File

The production release workflow is defined in:

```text
.github/workflows/export-put-release.yml
```

The workflow name is:

```text
Export Put Release
```

It is started manually through:

```yaml
workflow_dispatch
```

A production release is therefore not automatically created on every push.

---

# 2. Current Workflow Overview

The verified production workflow performs the following sequence:

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

This includes values such as:

```text
GITHUB_SHA
current commit
current branch
repository file listing
package.json presence
package-lock.json presence
```

---

# 4. Node.js and npm

The workflow uses:

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

If the lockfile does not match the package definition, the workflow fails
during installation.

---

# 6. Package Diagnostics

Before installation, the workflow currently prints additional package
diagnostics.

These include:

```text
@floating-ui/dom references
lockfile version
package name
package version
```

These diagnostics are useful for troubleshooting dependency and lockfile
issues.

They are not part of the release artifact itself.

---

# 7. Version

The release version is read from:

```text
package.json
```

using Node:

```bash
node -p "require('./package.json').version"
```

The value is stored as a GitHub Actions output.

Example:

```text
0.0.4
```

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

The timestamp is used as part of the release archive name.

---

# 9. Current Build Command

The current production export is created with:

```bash
npx expo export -p web
```

Expo writes the generated web application to:

```text
dist/
```

This is the current production build command.

---

# 10. Application Configuration Generation

The Application configuration is generated separately through:

```bash
npm run config:generate
```

Normal npm runtime commands such as:

```text
npm start
npm run web
npm run android
npm run ios
```

trigger configuration generation through npm lifecycle hooks.

The production release workflow does not currently use one of those npm
commands.

Instead, it executes:

```bash
npx expo export -p web
```

directly.

Therefore:

```text
npm lifecycle configuration generation
        |
        X
direct Expo export
```

The current production release workflow does not explicitly guarantee that the
generated Application configuration is refreshed immediately before export.

This is a known transitional build integration issue.

---

# 11. Current Configuration Risk

The runtime currently consumes the generated file:

```text
src/application/generated/applicationConfig.generated.ts
```

That file is generated from:

```text
src/application/config/application.properties
```

through:

```text
src/template/config/build/generateApplicationConfig.mjs
```

Because the production workflow does not currently execute:

```bash
npm run config:generate
```

before the Expo export, the generated TypeScript configuration could
theoretically be stale.

The build should eventually generate Application configuration
deterministically before every export.

---

# 12. Recommended Build Sequence

The desired production sequence is conceptually:

```text
npm ci
    |
    v
npm run config:generate
    |
    v
npx expo export -p web
    |
    v
package
    |
    v
publish
```

The workflow should not depend on a previously generated configuration file
being current.

This change should be implemented and tested separately from documentation.

---

# 13. Packaging

After the Expo export, the contents of:

```text
dist/
```

are packaged into a ZIP archive.

The current naming pattern is:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

Example:

```text
Agent.Workbench_0.0.4_20260811-0915.zip
```

The actual prefix is supplied through the repository secret:

```text
PROJECT_NAME
```

---

# 14. FTP Upload

The ZIP file is uploaded through FTP.

The configured target is:

```text
<PROJECT_PATH>
```

The workflow uses values from GitHub repository secrets.

Conceptually:

```text
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>
put <archive>.zip
exit
```

The target directory must already be available on the FTP server.

---

# 15. Required Repository Secrets

The verified production workflow uses:

| Secret | Purpose |
| --- | --- |
| `FTP_UPLOAD_URL` | FTP server address |
| `FTP_USER` | FTP username |
| `FTP_PSWD` | FTP password |
| `PROJECT_NAME` | Release archive name prefix |
| `PROJECT_PATH` | FTP target path |

The secret name:

```text
FTP_PSWD
```

must remain consistent with the workflow.

---

# 16. GitHub Release

After the FTP upload, the workflow creates a GitHub release through:

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

# 17. Duplicate Version Risk

The GitHub release tag is derived only from:

```text
package.version
```

The archive filename additionally contains a timestamp, but the Git tag does
not.

Therefore multiple production releases using the same package version may
conflict with an already existing release tag.

The package version should be reviewed before starting a production release.

---

# 18. Production vs Test Release

The production workflow publishes to the normal production FTP path:

```text
<PROJECT_PATH>
```

The test release workflow is documented separately in:

```text
doc/test-release.md
```

Test and production release workflows should remain clearly distinguishable.

---

# 19. Current Architecture Ownership

The current workflow still exists inside:

```text
web.template
```

This is valid during the architecture migration.

The target architecture is:

```text
Application --> Template --> Core
```

Concrete release and deployment configuration ultimately belongs to the
Application.

Examples include:

```text
Application version
artifact naming
release destination
product FTP target
deployment configuration
product release workflow
```

The Base Template may provide reusable build tooling.

It should not permanently own the concrete deployment process of
Agent.Workbench, HEMS or another product.

---

# 20. Target Repository Ownership

The target repository model is conceptually:

```text
Base Template Repository
|
+-- reusable Template
+-- reusable Core
+-- reusable build tooling where appropriate

Agent.Workbench Repository
|
+-- Application configuration
+-- product build
+-- product release workflow
+-- product deployment

HEMS Repository
|
+-- Application configuration
+-- product build
+-- product release workflow
+-- product deployment
```

Each Application should be independently releasable.

---

# 21. Current Status

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

## Transitional

```text
production workflow still owned by web.template
direct Expo export
generated Application configuration assumed to be current
shared repository contains concrete product release workflow
```

## Planned

```text
deterministic configuration generation before export
Application-owned release workflows
independent Agent.Workbench release
independent HEMS release
clear Base Template build-tooling boundary
```

---

# 22. Troubleshooting

## npm ci fails

Possible causes:

```text
package-lock.json is missing
package-lock.json is outdated
package.json and package-lock.json differ
dependency metadata is inconsistent
```

Typical local repair flow:

```bash
npm install
git add package.json package-lock.json
git commit -m "chore: update package lockfile"
```

Review the resulting dependency changes before committing.

---

## Application configuration is outdated

Regenerate the Application configuration locally:

```bash
npm run config:generate
```

Then verify:

```text
src/application/generated/applicationConfig.generated.ts
```

Before a final release, the build pipeline should eventually perform this
generation automatically.

---

## FTP upload fails

Verify:

```text
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_PATH
PROJECT_NAME
```

Also verify that the remote target directory exists.

---

## GitHub release fails

Verify:

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

# 23. Validation Before Production Release

Before creating a production release, validate at least:

```bash
npm run config:generate
npx tsc --noEmit
```

Run relevant automated tests and verify the Application through the normal npm
startup path.

Also verify:

```bash
git status
git diff --check
```

The production release should be created from a known and reviewed Git state.

---

# 24. Summary

The current production pipeline is:

```text
GitHub Actions
      |
      v
npm ci
      |
      v
npx expo export -p web
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

The main current architecture gap is:

```text
application.properties
        |
        v
config generation
        |
        X
production export
```

The production workflow does not yet explicitly regenerate Application
configuration before export.

Long term, concrete production release workflows belong to their respective
Application repositories.