# Redux State Management

The project uses Redux Toolkit. Redux is currently composed centrally while
feature state is being moved to its owning architecture layer.

## Central composition

```text
src/redux/store.ts
src/redux/rootReducer.ts
```

`rootReducer.ts` imports reducers from both migrated template modules and
two explicit transition modules under `src/redux/slices`.

Typed hooks currently live in:

```text
src/core/hooks/useAppDispatch.ts
src/core/hooks/useAppSelector.ts
```

These hooks depend on the concrete store types. Their final layer placement may
be revisited when store composition moves into the application layer.

## Architecture rule

Redux is a state-management technology, not an architecture layer.

A slice belongs to the layer that owns its responsibility:

- reusable technical state can belong to `core`
- reusable shell, navigation and UI state belongs to `template`
- product-specific business state belongs to `application`
- reducer composition belongs to the concrete application composition

The `src/redux` folder is therefore transitional and should not become the
permanent owner of all state.

## Current store slices

### Migrated template state

| State key | Current file | Responsibility |
| --- | --- | --- |
| `language` | `src/template/state/localization/languageSlice.tsx` | UI language and i18n synchronization. |
| `theme` | `src/template/state/theme/themeSlice.tsx` | Theme selection. |
| `menu` | `src/template/state/navigation/menuSlice.tsx` | Static/dynamic menu tree and active menu ID. |
| `servers` | `src/template/state/server/serverSlice.ts` | Saved servers and active environment. |
| `serverStatus` | `src/template/state/server/serverStatusSlice.ts` | Per-server UI status metadata. |
| `connectivity` | `src/template/state/connectivity/connectivitySlice.tsx` | Active server online/offline state. |
| `passwordChangePrompt` | `src/template/state/authentication/passwordChangePromptSlice.ts` | Initial password-change dialog state. |
| `notifications` | `src/template/state/notifications/notificationSlice.ts` | Local notifications grouped by server. |

### Additional migrated Template state

| State key | Current file | Responsibility |
| --- | --- | --- |
| `dataPermissions` | `src/template/state/privacy/dataPermissionsSlice.tsx` | Data-permission dialog and persisted privacy settings. |
| `organizations` | `src/template/state/organizations/organizationsSlice.tsx` | Persisted organization data. |
| `ready` | `src/template/state/bootstrap/readySlice.tsx` | Global bootstrap readiness flag. |
| `baseMode` | `src/template/state/mode/baseModeSlice.ts` | Base/customer mode state. |
| `dbSettings` | `src/template/state/settings/database/dbSettingsSlice.ts` | Database configuration state. |
| `execSettings` | `src/template/state/agent-workbench/execSettingsSlice.tsx` | Agent Workbench execution settings. |
| `dataAnalysis` | `src/template/state/agent-workbench/dataAnalysisSlice.ts` | Agent Workbench data-analysis state. |
| `appSettingsFileUpload` | `src/template/state/settings/appSettingsFileUploadSlice.ts` | Configuration file upload state. |
| `appRelease` | `src/template/state/release/appReleaseSlice.tsx` | Production/test release marker. |
| `userProfile` | `src/template/state/authentication/userProfileSlice.ts` | OIDC user profile data. |
| `developerConsole` | `src/template/state/developer-tools/developerConsoleSlice.ts` | Developer-console UI state. |
| `liveConsole` | `src/template/state/developer-tools/liveConsoleSlice.ts` | Live-console state and communication. |

### Explicit transition modules

Only two slices remain under `src/redux/slices`:

| State key | Current file | Responsibility / status |
| --- | --- | --- |
| `api` | `src/template/state/api/apiSlice.tsx` | API clients, authentication, active server, persistence and server switching. Mixed responsibility; separate before moving. |
| `sessionTime` | `src/redux/slices/sessionTimeSlice.tsx` | OIDC session state, direct HTTP requests and active-server access. Mixed responsibility; separate before moving. |

### Composition helpers outside Redux state

The update watchers are application bootstrap components:

```text
src/application/bootstrap/watchers/PostLoginUpdateWatcher.tsx
src/application/bootstrap/watchers/UpdateNotificationWatcher.tsx
```

The canonical frontend reload implementation is:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

`Data.ts` is located next to its owning organization state:

```text
src/template/state/organizations/Data.ts
```

## Initialization flow

The root application currently initializes shared state in this order:

1. `initializeServers`
2. `initializeLanguage`
3. `initializeTheme`
4. `initializeApi`
5. `initializeDataPermissions`
6. `initializeOrganizations`
7. `initializeMenu`

This makes server and API information available before dynamic menu loading.

## API client rebuilds

`apiSlice` builds generated clients from the active base URL and authentication
state.

For JWT:

```text
Authorization: Bearer <jwt>
```

For OIDC:

```text
withCredentials: true
```

OIDC sessions use browser cookies rather than a frontend-managed bearer token.

`apiSlice` is a known transition module because it currently also knows
template navigation. A final refactor must remove upward layer dependencies
before placing it in `core`.

## Menu state

The menu state is owned by the template:

```text
src/template/state/navigation/menuSlice.tsx
```

Navigation configuration is separate from state:

```text
src/template/navigation/menu/staticMenu.tsx
src/template/navigation/menu/featureFlags.ts
src/template/navigation/tabs/staticTabs.tsx
src/template/navigation/tabs/tabFeatureFlags.tsx
src/template/navigation/tabs/withAutoTabs.tsx
```

`staticMenu` and `staticTabs` are registries, not reducers.

## Notifications

Notification state is owned by:

```text
src/template/state/notifications/notificationSlice.ts
```

Notifications are grouped by a normalized server key. Selectors expose
notifications and unread counts for the active server.

The slice has targeted Jest coverage under:

```text
test/notificationSlice.test.ts
```

## Server state

Reusable shell state is split by concern:

```text
src/template/state/server/serverSlice.ts
src/template/state/server/serverStatusSlice.ts
src/template/state/connectivity/connectivitySlice.tsx
```

Shared server types and validation logic live in `src/core/server`.

## Authentication state

The initial password dialog is reusable UI state:

```text
src/template/state/authentication/passwordChangePromptSlice.ts
```

The main authentication state remains in `apiSlice.tsx` until its API,
authentication, server, storage and navigation responsibilities are separated.

The session-time slice also remains transitional because Core session hooks
currently consume it while it depends on the concrete `RootState` and
`apiSlice`.

## Import policy

Prefer stable aliases for cross-folder imports:

```ts
import type { RootState } from "@/redux/store";
import { selectTheme } from "@/template/state/theme/themeSlice";
import { Card } from "@design-system";
```

Do not replace every relative import blindly. Use exact search-and-replace for
a verified old path.

## Validation workflow

After moving state:

```bash
git grep -n "<old-path>" -- .
npx tsc --noEmit
npx jest --runTestsByPath <affected-test>
npx expo start --clear
```

Then commit the completed batch.

## Open decisions

- Move root reducer/store composition into the application composition layer.
- Revisit the final location of typed Redux hooks.
- Separate `apiSlice` into focused authentication, API-client, server and
  persistence responsibilities.
- Extract session HTTP communication from `sessionTimeSlice`.
- Add public layer APIs and automated import-boundary checks.

