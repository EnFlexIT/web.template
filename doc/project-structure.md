# Project Structure

This document describes the current structure and migration status of the
`web.template` repository.

`web.template` is an Expo / React Native Web / TypeScript foundation for
EnFlex.IT applications. It provides reusable infrastructure for authentication,
server management, navigation, notifications, localization, theming, updates,
configuration and generated Agent.Workbench API access.

## Architecture model

The repository is being migrated toward three explicit layers:

```text
application
    ↓
template
    ↓
core
```

The dependency rules are:

- `application` may use `template` and `core`.
- `template` may use `core`.
- `core` must not import from `template` or `application`.
- Product-specific business logic belongs in `application`.
- Reusable shell UI and reusable feature state belong in `template`.
- Reusable technical capabilities and shared types belong in `core`.

The migration is incremental. Some legacy folders and Redux modules remain until
their responsibilities are separated safely.

## Root level

```text
.
├── .github/workflows
├── assets
├── doc
├── scripts
├── src
├── test
├── app.json
├── i18n.ts
├── index.ts
├── jest.config.js
├── package.json
├── tsconfig.json
└── unistyles.ts
```

| Path | Purpose |
| --- | --- |
| `.github/workflows` | GitHub Actions for test and production web releases. |
| `assets` | Static assets and translation JSON files. |
| `doc` | Architecture, feature and workflow documentation. |
| `scripts` | Repository and release helper scripts. |
| `src` | Application source code. |
| `test` | Jest tests and `jest.setup.ts`. |
| `index.ts` | Expo entry point. |
| `i18n.ts` | i18next configuration. |
| `unistyles.ts` | Theme and breakpoint configuration. |
| `jest.config.js` | Jest configuration for tests under `test/`. |
| `package.json` | NPM scripts and dependencies. |

`architecture-docs-current.txt` is only a temporary documentation export and is
not part of the intended architecture.

## Current source structure

The following tree shows the important current structure. It is intentionally
not an exhaustive file listing.

```text
src
├── api
├── application
├── bootstrap
├── components
├── core
│   ├── authentication
│   ├── hooks
│   ├── server
│   └── update
├── permissions
├── redux
│   ├── selectors
│   ├── slices
│   ├── rootReducer.ts
│   └── store.ts
├── screens
├── styles
├── template
│   ├── components
│   │   ├── design-system
│   │   ├── layout
│   │   └── notifications
│   ├── hooks
│   ├── navigation
│   │   ├── menu
│   │   └── tabs
│   ├── screens
│   └── state
│       ├── agent-workbench
│       ├── authentication
│       ├── bootstrap
│       ├── connectivity
│       ├── developer-tools
│       ├── localization
│       ├── mode
│       ├── navigation
│       ├── notifications
│       ├── organizations
│       ├── privacy
│       ├── release
│       ├── server
│       ├── settings
│       └── theme
└── util
```

`src/components`, `src/screens` and parts of `src/redux/slices` still contain
legacy or not-yet-classified modules. Their presence does not change the target
dependency rules.

## Core

`src/core` contains reusable technical capabilities without product UI.

Important areas:

```text
src/core
├── authentication
│   ├── http
│   ├── jwt
│   ├── logout
│   ├── session
│   └── types.ts
├── hooks
│   ├── useAppDispatch.ts
│   └── useAppSelector.ts
├── server
│   ├── detectServerEnvironment.ts
│   ├── normalizeServerInputs.ts
│   ├── serverCheck.ts
│   ├── serverValidation.ts
│   └── types.ts
└── update
```

Current responsibilities include:

- authentication transport and interceptors
- JWT renewal
- OIDC/JWT session guards and timers
- logout orchestration
- server validation and authentication detection
- shared server and authentication types
- update-related technical logic

The canonical authentication type is:

```text
src/core/authentication/types.ts
```

The canonical `ServerEnvironment` type is:

```text
src/core/server/types.ts
```

## Template

`src/template` contains reusable shell UI, reusable navigation and reusable
feature state.

### Design system

```text
src/template/components/design-system
├── stylistic
├── themed
├── ui-elements
└── index.ts
```

The public alias is:

```ts
import { Card, ActionButton } from "@design-system";
```

New reusable UI should use the public design-system API instead of deep imports
where possible.

### Template hooks

```text
src/template/hooks
├── useFileDropWeb.ts
├── useIsWide.ts
├── useThemedScrollbarWeb.ts
└── useUpdateNotifierWeb.ts
```

### Navigation

```text
src/template/navigation
├── menu
│   ├── featureFlags.ts
│   └── staticMenu.tsx
└── tabs
    ├── staticTabs.tsx
    ├── tabFeatureFlags.tsx
    └── withAutoTabs.tsx
```

Navigation registries and feature-flag rules are configuration, not Redux state.

### Migrated Template state

```text
src/template/state
├── agent-workbench
│   ├── dataAnalysisSlice.ts
│   └── execSettingsSlice.tsx
├── authentication
│   ├── passwordChangePromptSlice.ts
│   └── userProfileSlice.ts
├── bootstrap
│   └── readySlice.tsx
├── connectivity
│   └── connectivitySlice.tsx
├── developer-tools
│   ├── developerConsoleSlice.ts
│   └── liveConsoleSlice.ts
├── localization
│   └── languageSlice.tsx
├── mode
│   └── baseModeSlice.ts
├── navigation
│   └── menuSlice.tsx
├── notifications
│   └── notificationSlice.ts
├── organizations
│   ├── Data.ts
│   └── organizationsSlice.tsx
├── privacy
│   └── dataPermissionsSlice.tsx
├── release
│   └── appReleaseSlice.tsx
├── server
│   ├── serverSlice.ts
│   └── serverStatusSlice.ts
├── settings
│   ├── database
│   │   └── dbSettingsSlice.ts
│   └── appSettingsFileUploadSlice.ts
└── theme
    └── themeSlice.tsx
```

These modules are reusable shell, UI or reusable Template feature state.

## Application

`src/application` is the target location for concrete product composition and
business-specific functionality.

Examples of future application responsibilities:

- product-specific screens
- product-specific business state
- concrete feature selection
- product branding and configuration
- application-specific services and hooks
- composition of template and core modules

The application layer may be empty or only partially populated while the
migration is in progress.

## API structure

```text
src/api
├── config
├── definition
├── implementation
├── services
├── apiConfig.ts
└── publicApiConfig.ts
```

`src/api/definition` contains the API definitions. Generated Axios clients are
stored under:

```text
src/api/implementation/AWB-RestAPI
src/api/implementation/Dynamic-Content-Api
```

Generation scripts:

```bash
npm run AWB-RestAPI
npm run Dynamic-Content-Api
npm run api
```

Generated files should not be manually refactored into the architecture layers.

## Redux composition and migration state

The store and root reducer currently remain central:

```text
src/redux/store.ts
src/redux/rootReducer.ts
```

They compose reducers from migrated Template modules, Core update state and two
explicit transition modules.

Only these files remain under `src/redux/slices`:

```text
apiSlice.tsx
sessionTimeSlice.tsx
```

They are intentionally not moved blindly:

- `apiSlice.tsx` combines API clients, authentication, active-server state,
  persistence, runtime configuration and Template menu initialization.
- `sessionTimeSlice.tsx` combines Redux state, direct HTTP requests,
  active-server selection and session timing.

Both require responsibility separation before their final layer placement.

Update watchers now belong to Application bootstrap:

```text
src/application/bootstrap/watchers
├── PostLoginUpdateWatcher.tsx
└── UpdateNotificationWatcher.tsx
```

The canonical frontend reload helper belongs to Core:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

## Tests

Tests are stored in:

```text
test
├── jest.setup.ts
└── *.test.ts / *.test.tsx
```

The normal validation sequence is:

```bash
npx tsc --noEmit
npx jest --runTestsByPath <test-file>
npx expo start --clear
```

## Refactoring workflow

For architecture moves, use this sequence:

1. Search all usages with `git grep -- .`.
2. Inspect internal imports.
3. Replace fragile relative imports with stable aliases where appropriate.
4. Move a small related group.
5. Perform exact global path replacement.
6. Search for every old path variant.
7. Run TypeScript.
8. Run targeted tests.
9. Start Expo with a cleared cache.
10. Commit the completed batch.

## Next architecture steps

1. Keep documentation synchronized with the physical structure.
2. Separate authentication, API-client, server and persistence responsibilities
   inside `apiSlice.tsx`.
3. Extract session HTTP communication from `sessionTimeSlice.tsx`.
4. Move concrete store and root-reducer composition into `src/application`.
5. Review the remaining legacy top-level components and screens.
6. Add public APIs and aliases for Core, Template and Application.
7. Add automated dependency-boundary checks.
