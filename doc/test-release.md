# Test Release

The project contains a separate GitHub Action for test releases.

## Workflow

File:

```text
.github/workflows/export-put-test-release.yml
```

Workflow name:

```text
Export Put Test Release
```

The workflow is started manually through `workflow_dispatch`.

## Purpose

The test release workflow allows publishing a web build without replacing the normal production release location. This is useful for validating a new frontend build with the backend update mechanism before publishing it as production release.

## Main steps

1. Checkout repository.
2. Setup Node.js 20.
3. Update npm to version 10.
4. Validate dependencies with `npm ci`.
5. Read the version from `package.json`.
6. Generate a timestamp.
7. Export the Expo web build:

```bash
npx expo export -p web
```

8. Package the `dist` folder into a ZIP file.
9. Upload the ZIP as GitHub workflow artifact.
10. Upload the ZIP to the FTP test folder:

```text
<PROJECT_PATH>/test
```

## Artifact naming in the current workflow

The current workflow creates the same base artifact name as the production workflow:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

The test character is currently expressed through the target folder:

```text
<PROJECT_PATH>/test
```

## Optional naming convention

If test releases should be visible directly in the filename, the workflow can be adjusted to create:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>-TEST.zip
```

This would make backup, FTP overview and manual inspection easier.

## Frontend release type display

The frontend stores the current web application release type in `appReleaseSlice.tsx`.

Supported release types:

```ts
"PRODUCTION_RELEASE" | "TEST_RELEASE" | "UNKNOWN"
```

The release type is read from the backend app settings key:

```text
_WebAppReleaseType
```

If the backend returns `TEST_RELEASE`, the footer shows a visible `TEST` badge.

## Related files

| File | Purpose |
| --- | --- |
| `.github/workflows/export-put-test-release.yml` | Builds and uploads test release. |
| `src/redux/slices/appReleaseSlice.tsx` | Stores release type in Redux/localStorage. |
| `src/screens/login/serverCheck.ts` | Parses `_WebAppReleaseType` from app settings. |
| `src/components/Footer.tsx` | Displays the `TEST` badge. |
