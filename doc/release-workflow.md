# Release Workflow

The project provides GitHub Actions to export the Expo web application and upload the resulting ZIP file to an FTP server.

## Production release workflow

File:

```text
.github/workflows/export-put-release.yml
```

Workflow name:

```text
Export Put Release
```

The workflow is started manually through `workflow_dispatch`.

## Main steps

1. Checkout repository.
2. Setup Node.js 20.
3. Update npm to version 10.
4. Validate dependencies with `npm ci`.
5. Read the project version from `package.json`.
6. Create a timestamp in `yyyyMMdd-HHmm` format.
7. Export the Expo web build with:

```bash
npx expo export -p web
```

8. Package the `dist` folder into a ZIP file.
9. Upload the ZIP file to the configured FTP path.
10. Create a GitHub release using `softprops/action-gh-release`.

## Required repository secrets

| Secret | Purpose |
| --- | --- |
| `FTP_UPLOAD_URL` | FTP server URL. |
| `FTP_USER` | FTP user. |
| `FTP_PSWD` | FTP password. |
| `PROJECT_NAME` | Prefix for the generated ZIP artifact. |
| `PROJECT_PATH` | Target path on the FTP server. The directory must already exist. |

## Artifact naming

The production workflow currently creates artifacts using this pattern:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

Example:

```text
baseTemplate_0.0.4_20260706-1421.zip
```

## Notes

The workflow depends on a valid `package-lock.json` because it uses `npm ci`. The GitHub release tag is currently generated from the package version:

```text
v<package.version>
```

If multiple releases use the same package version, the release/tag behavior should be checked before running the workflow repeatedly.
