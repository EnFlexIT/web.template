# Test Release

This document describes the test release workflow of the web.template project.

The test release workflow creates a web application build like the production release workflow, but uploads it into a dedicated test target folder.

## Purpose

The test release workflow is used to validate a new frontend build before publishing it as production release.

It is intended for:

- internal testing
- validation with backend update logic
- checking update behavior
- testing new UI or infrastructure changes
- verifying a release artifact before production usage

## Workflow file

```txt
.github/workflows/export-put-test-release.yml
```

Workflow name:

```txt
Export Put Test Release
```

The workflow is started manually through GitHub Actions by using:

```txt
workflow_dispatch
```

## Difference to production release

| Area | Production release | Test release |
| --- | --- | --- |
| Workflow file | `export-put-release.yml` | `export-put-test-release.yml` |
| GitHub Action name | `Export Put Release` | `Export Put Test Release` |
| FTP target | `<PROJECT_PATH>` | `<PROJECT_PATH>/test` |
| GitHub release | Created | Not created |
| Workflow artifact | Not uploaded separately | Uploaded as GitHub workflow artifact |
| Usage | Stable production build | Internal validation/test build |

## Main workflow steps

The test release workflow performs the following steps:

1. Checkout the repository.
2. Print Git and package debug information.
3. Setup Node.js 20.
4. Update npm to version 10.
5. Validate the lockfile and install dependencies with `npm ci`.
6. Read the application version from `package.json`.
7. Generate a timestamp.
8. Export the Expo web application.
9. Package the generated `dist` folder into a ZIP file.
10. Upload the ZIP file as GitHub workflow artifact.
11. Upload the ZIP file to the FTP test folder.

## Build command

The Expo web export is created with:

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
| `FTP_UPLOAD_URL` | FTP server URL used for uploading the test artifact. |
| `FTP_USER` | FTP username. |
| `FTP_PSWD` | FTP password. |
| `PROJECT_NAME` | Name prefix used for the generated ZIP file. |
| `PROJECT_PATH` | Base target directory on the FTP server. The test workflow appends `/test`. |

> Important: The workflow uses `FTP_PSWD`. Keep the secret name exactly as defined in the workflow file.

## Artifact naming

The current test release workflow creates ZIP files using the same base naming pattern as the production release workflow:

```txt
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

Example:

```txt
baseTemplate_0.0.4_20260706-1421.zip
```

The test character is currently expressed through the upload target:

```txt
<PROJECT_PATH>/test
```

## Upload target

The test ZIP file is uploaded to:

```txt
<PROJECT_PATH>/test
```

on the configured FTP server.

The workflow uses an FTP command sequence similar to:

```txt
open <FTP_UPLOAD_URL>
user <FTP_USER> <FTP_PSWD>
cd <PROJECT_PATH>/test
put <artifact>.zip
exit
```

The `/test` directory must already exist on the FTP server.

## GitHub workflow artifact

In addition to the FTP upload, the test workflow uploads the generated ZIP as a GitHub workflow artifact.

This is useful because the artifact can be downloaded directly from the GitHub Actions run for inspection or manual testing.

## Frontend release type display

The frontend supports displaying whether the currently loaded web application is a test release.

Relevant Redux release types:

```ts
"PRODUCTION_RELEASE" | "TEST_RELEASE" | "UNKNOWN"
```

The release type is read from the backend application settings key:

```txt
_WebAppReleaseType
```

If the backend returns:

```txt
TEST_RELEASE
```

the footer can show a visible `TEST` badge.

## Related frontend files

| File | Purpose |
| --- | --- |
| `src/redux/slices/appReleaseSlice.tsx` | Stores the current web application release type. |
| `src/screens/login/serverCheck.ts` | Reads backend application settings and parses `_WebAppReleaseType`. |
| `src/components/Footer.tsx` | Displays release related UI such as the `TEST` badge. |

## When to use this workflow

Use the test release workflow when:

- a build should be tested before production
- update behavior needs to be validated
- backend/frontend compatibility should be checked
- release artifacts should be inspected manually
- new infrastructure changes should be tested safely

Do not use this workflow as final production release.

## Optional improvement: TEST suffix in file name

Currently, the test release is identified by the target folder:

```txt
<PROJECT_PATH>/test
```

Optionally, the workflow can be changed to include a `-TEST` suffix in the file name:

```txt
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>-TEST.zip
```

This would make it easier to identify test artifacts in backups, logs and manual FTP inspection.

## Troubleshooting

### Test artifact does not appear on FTP server

Possible reasons:

- `<PROJECT_PATH>/test` does not exist
- wrong FTP credentials
- wrong `PROJECT_PATH`
- missing repository secrets

Check:

```txt
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_NAME
PROJECT_PATH
```

Also verify that this directory exists on the FTP server:

```txt
<PROJECT_PATH>/test
```

### Test badge is not visible

Possible reasons:

- backend does not return `_WebAppReleaseType`
- value is not `TEST_RELEASE`
- release type was not loaded during server check
- frontend state still contains an old value

Check the backend application settings response and the release type handling in:

```txt
src/screens/login/serverCheck.ts
src/redux/slices/appReleaseSlice.tsx
src/components/Footer.tsx
```

### Workflow artifact exists, but FTP upload failed

This means the build and packaging steps were successful, but the FTP upload failed.

Check:

- FTP credentials
- FTP target path
- FTP server availability
- workflow logs for the `Put to test folder` step