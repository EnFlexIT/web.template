# Release Workflow

This document describes the production release workflow of the web.template project.

The project uses a GitHub Actions workflow to build the Expo web application, package the exported web build as a ZIP file and upload it to a configured FTP target.

## Purpose

The production release workflow is used to create a deployable web application artifact.

It is intended for stable versions that should be made available through the normal application update mechanism.

## Workflow file

```txt
.github/workflows/export-put-release.yml
```

Workflow name:

```txt
Export Put Release
```

The workflow is started manually through GitHub Actions by using:

```txt
workflow_dispatch
```

This means the release is not created automatically on every push. A developer has to start it manually.

## Main workflow steps

The production release workflow performs the following steps:

1. Checkout the repository.
2. Print Git and package debug information.
3. Setup Node.js 20.
4. Update npm to version 10.
5. Validate the lockfile and install dependencies with `npm ci`.
6. Read the application version from `package.json`.
7. Generate a timestamp.
8. Export the Expo web application.
9. Package the generated `dist` folder into a ZIP file.
10. Upload the ZIP file to the configured FTP path.
11. Create a GitHub release using the generated ZIP file.

## Build command

The actual Expo web export is created with:

```bash
npx expo export -p web
```

The output is written to:

```txt
dist/
```

The content of this folder is then zipped and uploaded.

## Required repository secrets

The workflow requires the following GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `FTP_UPLOAD_URL` | FTP server URL used for uploading the release artifact. |
| `FTP_USER` | FTP username. |
| `FTP_PSWD` | FTP password. |
| `PROJECT_NAME` | Name prefix used for the generated ZIP file. |
| `PROJECT_PATH` | Target directory on the FTP server. The directory must already exist. |

> Important: The workflow uses `FTP_PSWD`. Keep the secret name exactly as defined in the workflow file.

## Artifact naming

The production workflow creates ZIP files using this pattern:

```txt
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

Example:

```txt
baseTemplate_0.0.4_20260706-1421.zip
```

The version is read from:

```txt
package.json
```

The timestamp is generated during the workflow run.

## Upload target

The production ZIP file is uploaded to:

```txt
<PROJECT_PATH>
```

on the configured FTP server.

The workflow uses an FTP command sequence similar to:

```txt
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>
put <artifact>.zip
exit
```

## GitHub release

After uploading the ZIP file to the FTP server, the workflow also creates a GitHub release using:

```txt
softprops/action-gh-release@v2
```

The release tag is generated from the package version:

```txt
v<package.version>
```

Example:

```txt
v0.0.4
```

## When to use this workflow

Use the production release workflow when:

- the application version is stable
- the build should be available as normal release
- the update mechanism should consume the production artifact
- the release has already been tested

Do not use this workflow for experimental builds or internal validation. Use the test release workflow for that.

## Notes

The workflow uses `npm ci`, therefore a valid and up-to-date `package-lock.json` is required.

If dependencies in `package.json` and `package-lock.json` do not match, the workflow will fail during the install step.

The GitHub release tag is based only on the package version. If the same version is released multiple times, the GitHub release/tag behavior should be checked.

## Troubleshooting

### `npm ci` fails

Possible reasons:

- `package-lock.json` is missing
- `package-lock.json` is not in sync with `package.json`
- dependencies were changed without updating the lockfile

Fix:

```bash
npm install
git add package-lock.json package.json
git commit -m "chore: Update package lockfile"
```

### FTP upload fails

Possible reasons:

- wrong FTP credentials
- missing repository secrets
- wrong `PROJECT_PATH`
- target directory does not exist on the FTP server

Check the following secrets:

```txt
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_NAME
PROJECT_PATH
```

### GitHub release fails

Possible reasons:

- release tag already exists
- missing GitHub permissions
- package version was not updated

Check the package version in:

```txt
package.json
```

and verify whether a release tag with the same version already exists.