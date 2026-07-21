# Review Notes

These notes are based on the current project ZIP and should be reviewed before committing documentation or release changes.

## Repository hygiene

The uploaded ZIP contained local/generated folders and files that should not be committed or shared in documentation packages:

```text
.git
.expo
node_modules
.env
```

`.gitignore` currently ignores `.env*.local`, but not a plain `.env` file. Consider adding:

```gitignore
.env
```

or using only `.env.example` for documented environment variables.

## Environment variables

The current `.env` file contains these public Expo keys:

```text
EXPO_PUBLIC_APPLICATION_TITLE
EXPO_PUBLIC_DEFAULT_LANGUAGE
EXPO_PUBLIC_DEFAULT_DEV_IP
EXPO_PUBLIC_DEFAULT_PROD_IP
EXPO_PUBLIC_OIDC_ISSUER
EXPO_PUBLIC_OIDC_CLIENT_ID
EXPO_PUBLIC_OIDC_SCOPES
```

Do not document or commit real values if they contain internal server information.

## Test release filename

The current test release workflow uploads to `<PROJECT_PATH>/test`, but the ZIP filename itself does not include `-TEST`.

If the intended convention is a filename such as:

```text
baseTemplate_0.0.4_20260706-1421-TEST.zip
```

then `.github/workflows/export-put-test-release.yml` should be adjusted.

## Documentation priority

Recommended first commit:

1. Add `doc/project-structure.md`.
2. Add `doc/release-workflow.md` and `doc/test-release.md`.
3. Add `doc/authentication.md`.
4. Add `doc/server-check-and-switching.md`.
5. Add `doc/update-system.md`.
6. Add `doc/file-configuration-upload.md`.
7. Add README links to the new documentation files.

## Naming cleanup candidates

The test folder is currently named:

```text
src/testes
```

This may be intentional, but if not, consider renaming it to `src/tests` and updating `jest.config.js`.

## PWA status

No dedicated PWA files such as `manifest.json` or a custom service worker were found in the current project ZIP. PWA documentation should therefore be added later only after the implementation exists.
