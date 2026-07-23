# Project Structure

This document describes the current structure of the `web.template` repository.
The project is an Expo / React Native Web template for EnFlex.IT applications and contains shared infrastructure for theming, authentication, server selection, dynamic content, settings, update handling and generated Agent.Workbench API access.

## Root level

```text
.
├── .github/workflows
├── assets
├── doc
├── scripts
├── src
├── app.json
├── i18n.ts
├── index.ts
├── package.json
├── tsconfig.json
└── unistyles.ts
```

| Path | Purpose |
| --- | --- |
| `.github/workflows` | GitHub Actions for production and test web releases. |
| `assets` | Static assets such as icons, images and translation JSON files. |
| `doc` | Existing UML files and new Markdown documentation. |
| `scripts` | Helper scripts, for example template-branch initialization. |
| `src` | Application source code. |
| `index.ts` | Expo entry point. Imports unistyles/i18n and registers the root app. |
| `i18n.ts` | i18next setup for German and English translation namespaces. |
| `unistyles.ts` | React Native Unistyles theme and breakpoint configuration. |
| `package.json` | NPM scripts and dependencies. |

## Source structure

```text
src
├── api
├── bootstrap
├── components
├── core
├── hooks
├── permissions
├── redux
├── screens
├── styles
├── testes
└── util
```

| Path | Purpose |
| --- | --- |
| `src/api` | API configuration, OpenAPI definitions, generated clients and small service wrappers. |
| `src/bootstrap` | Startup helpers such as application mode detection. |
| `src/components` | Reusable React Native components. |
| `src/hooks` | Typed Redux hooks and web-specific hooks for session, updates and file drop. |
| `src/permissions` | Permission selector helpers. |
| `src/redux` | Redux store, slices, selectors and constants. |
| `src/screens` | Full screen components used by navigation. |
| `src/styles` | Light/dark themes, fonts and chart theme. |
| `src/testes` | Jest tests and setup. |
| `src/util` | Shared utility functions for runtime, JWT time, environment and server status events. |

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

`src/api/definition` is configured as Git submodule and points to the EnFlexIT `RestAPIs` repository. The generated TypeScript Axios clients are stored under `src/api/implementation/AWB-RestAPI` and `src/api/implementation/Dynamic-Content-Api`.

The NPM scripts in `package.json` regenerate these clients:

```bash
npm run AWB-RestAPI
npm run Dynamic-Content-Api
npm run api
```
## Core structure

The reusable platform functionality is gradually being extracted into the
dedicated `src/core` directory.

Current structure:

```text
src/core
├── authentication
│   ├── http
│   ├── jwt
│   ├── logout
│   └── session
├── server
└── update
```

### authentication

Provides reusable authentication infrastructure including:

- authentication interceptors
- JWT renewal
- session management
- logout handling
- session guards

### server

Provides reusable server functionality including:

- server validation
- server reachability
- authentication detection
- shared server types

### update

Provides reusable update functionality including:

- frontend version monitoring
- reload handling
- shared update state
## Components structure

```text
src/components
├── config
├── dynamic
├── richtexteditor
├── routing
├── stylistic
├── themed
├── ui-elements
├── Footer.tsx
├── Header.tsx
├── Navigation.tsx
└── Screen.tsx
```

The component layer is split into application layout, routing helpers, styled primitives and reusable UI elements.

`themed` components apply theme colors. `stylistic` components build on top of the themed components and define typography or sizing. `ui-elements` contains reusable application widgets such as cards, buttons, dialogs, dropdowns, tabs and inputs.

## Redux structure

```text
src/redux
├── constants
├── selectors
├── slices
└── store.ts
```

`store.ts` combines all application slices. Important slices include:

| Slice | Responsibility |
| --- | --- |
| `apiSlice` | API clients, selected base URL, JWT/OIDC state, login/logout and server switching. |
| `serverSlice` | Stored server list and active environment (`DEV`, `TEST`, `PROD`). |
| `connectivitySlice` | Server reachability checks via `/api/alive`. |
| `serverStatusSlice` | UI status metadata per configured server. |
| `menuSlice` | Static and dynamic menu construction. |
| `staticMenu` / `staticTabs` | Static settings menu and tab definitions. |
| `updateSlice` | Frontend/backend update state and update requests. |
| `appSettingsFileUploadSlice` | Upload state for app settings/configuration files. |
| `sessionTimeSlice` | Session time loading and extension for OIDC sessions. |
| `notificationSlice` | Local notifications per server. |
| `appReleaseSlice` | Production/test release type marker. |
| `userProfileSlice` | OIDC user profile fields from server settings. |

## Screens structure

```text
src/screens
├── AgentWorkbenchOptions
├── Logout
├── Notification
├── UserProfile
├── dev
├── dynamic-content
├── login
├── settings
├── update
├── Home.tsx
├── MenuHubScreen.tsx
├── ServerSettings.tsx
├── ServerSwitchOverlay.tsx
├── Settings.tsx
└── TabScreen.tsx
```

Main screen groups:

| Path | Purpose |
| --- | --- |
| `login` | JWT/OIDC login, server detection and login modals. |
| `settings` | Settings screens, database settings and file configuration upload. |
| `update` | Frontend/backend update tabs and progress dialog. |
| `AgentWorkbenchOptions` | Agent Workbench program start and data analysis options. |
| `UserProfile` | OIDC user profile display. |
| `Notification` | Notification overview. |
| `MenuHubScreen.tsx` | Hub view for grouped settings menu entries. |
| `TabScreen.tsx` | Generic tab renderer driven by `staticTabs`. |
| `ServerSwitchOverlay.tsx` | UI overlay for server switch flows. |
| `OfflineOverlay.tsx` | UI overlay for connectivity errors. |

## Routing and menu model

The application combines dynamic menu entries from the backend with static menu entries defined in `staticMenu.tsx`.

`buildMenuPaths` creates stable slug paths from menu captions. `useMenuNavigation` synchronizes React Navigation with the Redux active menu ID. This keeps breadcrumbs, sidebar selection and browser URLs in sync.

Static menu entries can automatically become tab screens through `withAutoTabs`. If a menu ID has tabs in `staticTabs.tsx`, its screen is replaced with `TabScreen`.
