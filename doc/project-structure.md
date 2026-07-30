Project Structure

This document describes the current structure and migration status of theweb.template repository.

web.template is an Expo / React Native Web / TypeScript foundation forEnFlex.IT applications. It provides reusable infrastructure for authentication,server management, navigation, notifications, localization, theming, updates,configuration and generated Agent.Workbench API access.

Architecture model

The repository is being migrated toward three explicit layers:

application
    ↓
template
    ↓
core

The dependency rules are:

application may use template and core.

template may use core.

core must not import from template or application.

Product-specific business logic belongs in application.

Reusable shell UI and reusable feature state belong in template.

Reusable technical capabilities and shared types belong in core.

The migration is incremental. Some legacy folders and Redux modules remain untiltheir responsibilities are separated safely.

Root level

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

Path

Purpose

.github/workflows

GitHub Actions for test and production web releases.

assets

Static assets and translation JSON files.

doc

Architecture, feature and workflow documentation.

scripts

Repository and release helper scripts.

src

Application source code.

test

Jest tests and jest.setup.ts.

index.ts

Expo entry point.

i18n.ts

i18next configuration.

unistyles.ts

Theme and breakpoint configuration.

jest.config.js

Jest configuration for tests under test/.

package.json

NPM scripts and dependencies.

architecture-docs-current.txt is only a temporary documentation export and isnot part of the intended architecture.

Current source structure

The following tree shows the important current structure. It is intentionallynot an exhaustive file listing.

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
│       ├── authentication
│       ├── connectivity
│       ├── localization
│       ├── navigation
│       ├── notifications
│       ├── server
│       └── theme
└── util

src/components, src/screens and parts of src/redux/slices still containlegacy or not-yet-classified modules. Their presence does not change the targetdependency rules.

Core

src/core contains reusable technical capabilities without product UI.

Important areas:

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

Current responsibilities include:

authentication transport and interceptors

JWT renewal

OIDC/JWT session guards and timers

logout orchestration

server validation and authentication detection

shared server and authentication types

update-related technical logic

The canonical authentication type is:

src/core/authentication/types.ts

The canonical ServerEnvironment type is:

src/core/server/types.ts

Template

src/template contains reusable shell UI, reusable navigation and reusablefeature state.

Design system

src/template/components/design-system
├── stylistic
├── themed
├── ui-elements
└── index.ts

The public alias is:

import { Card, ActionButton } from "@design-system";

New reusable UI should use the public design-system API instead of deep importswhere possible.

Template hooks

src/template/hooks
├── useFileDropWeb.ts
├── useIsWide.ts
├── useThemedScrollbarWeb.ts
└── useUpdateNotifierWeb.ts

Navigation

src/template/navigation
├── menu
│   ├── featureFlags.ts
│   └── staticMenu.tsx
└── tabs
    ├── staticTabs.tsx
    ├── tabFeatureFlags.tsx
    └── withAutoTabs.tsx

Navigation registries and feature-flag rules are configuration, not Redux state.

Migrated template state

src/template/state
├── authentication
│   └── passwordChangePromptSlice.ts
├── connectivity
│   └── connectivitySlice.tsx
├── localization
│   └── languageSlice.tsx
├── navigation
│   └── menuSlice.tsx
├── notifications
│   └── notificationSlice.ts
├── server
│   ├── serverSlice.ts
│   └── serverStatusSlice.ts
└── theme
    └── themeSlice.tsx

These modules are reusable shell or UI state and therefore belong to thetemplate layer.

Application

src/application is the target location for concrete product composition andbusiness-specific functionality.

Examples of future application responsibilities:

product-specific screens

product-specific business state

concrete feature selection

product branding and configuration

application-specific services and hooks

composition of template and core modules

The application layer may be empty or only partially populated while themigration is in progress.

API structure

src/api
├── config
├── definition
├── implementation
├── services
├── apiConfig.ts
└── publicApiConfig.ts

src/api/definition contains the API definitions. Generated Axios clients arestored under:

src/api/implementation/AWB-RestAPI
src/api/implementation/Dynamic-Content-Api

Generation scripts:

npm run AWB-RestAPI
npm run Dynamic-Content-Api
npm run api

Generated files should not be manually refactored into the architecture layers.

Redux composition and migration state

The store and root reducer currently remain central:

src/redux/store.ts
src/redux/rootReducer.ts

They compose reducers from both migrated template modules and legacy Reduxmodules.

Important legacy or transitional modules still under src/redux/slicesinclude:

apiSlice.tsx
appReleaseSlice.tsx
appSettingsFileUploadSlice.ts
baseModeSlice.ts
Data.ts
dataAnalysisSlice.ts
dataPermissionsSlice.tsx
dbSettingsSlice.ts
developerConsoleSlice.ts
execSettingsSlice.tsx
liveConsoleSlice.ts
organizationsSlice.tsx
PostLoginUpdateWatcher.tsx
readySlice.tsx
reloadUpdatedFrontendWebApp.ts
sessionTimeSlice.tsx
UpdateNotificationWatcher.tsx
userProfileSlice.ts

Not every file in this folder is a Redux slice. Watchers and reload helpersshould eventually move to their owning feature or technical module.

Two important transition modules are intentionally not moved blindly:

apiSlice.tsx currently combines API clients, authentication, serverselection, storage and menu initialization.

sessionTimeSlice.tsx currently combines Redux state, HTTP requests, activeserver selection and session timing.

They require responsibility separation before a final layer placement.

Tests

Tests are stored in:

test
├── jest.setup.ts
└── *.test.ts / *.test.tsx

The normal validation sequence is:

npx tsc --noEmit
npx jest --runTestsByPath <test-file>
npx expo start --clear

Refactoring workflow

For architecture moves, use this sequence:

Search all usages with git grep -- ..

Inspect internal imports.

Replace fragile relative imports with stable aliases where appropriate.

Move a small related group.

Perform exact global path replacement.

Search for every old path variant.

Run TypeScript.

Run targeted tests.

Start Expo with a cleared cache.

Commit the completed batch.

Next architecture steps

Finish documentation and keep it synchronized with moves.

Classify the remaining legacy Redux modules in a few batches.

Separate apiSlice and sessionTimeSlice responsibilities.

Move product-specific code into src/application.

Add public APIs for core, template and application.

Introduce layer aliases only after the physical structure is stable.

Add automated dependency-boundary checks.