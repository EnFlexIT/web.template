Redux State Management

The project uses Redux Toolkit. Redux is currently composed centrally whilefeature state is being moved to its owning architecture layer.

Central composition

src/redux/store.ts
src/redux/rootReducer.ts

rootReducer.ts imports reducers from both migrated template modules andlegacy modules under src/redux/slices.

Typed hooks currently live in:

src/core/hooks/useAppDispatch.ts
src/core/hooks/useAppSelector.ts

These hooks depend on the concrete store types. Their final layer placement maybe revisited when store composition moves into the application layer.

Architecture rule

Redux is a state-management technology, not an architecture layer.

A slice belongs to the layer that owns its responsibility:

reusable technical state can belong to core

reusable shell, navigation and UI state belongs to template

product-specific business state belongs to application

reducer composition belongs to the concrete application composition

The src/redux folder is therefore transitional and should not become thepermanent owner of all state.

Current store slices

Migrated template state

State key

Current file

Responsibility

language

src/template/state/localization/languageSlice.tsx

UI language and i18n synchronization.

theme

src/template/state/theme/themeSlice.tsx

Theme selection.

menu

src/template/state/navigation/menuSlice.tsx

Static/dynamic menu tree and active menu ID.

servers

src/template/state/server/serverSlice.ts

Saved servers and active environment.

serverStatus

src/template/state/server/serverStatusSlice.ts

Per-server UI status metadata.

connectivity

src/template/state/connectivity/connectivitySlice.tsx

Active server online/offline state.

passwordChangePrompt

src/template/state/authentication/passwordChangePromptSlice.ts

Initial password-change dialog state.

notifications

src/template/state/notifications/notificationSlice.ts

Local notifications grouped by server.

Transitional legacy state

State key

Current file

Responsibility / status

api

src/redux/slices/apiSlice.tsx

API clients, active server, authentication, storage and server switching. Mixed responsibility; do not move without separation.

sessionTime

src/redux/slices/sessionTimeSlice.tsx

OIDC session timing plus direct HTTP requests and API-state access. Mixed responsibility.

dataPermissions

src/redux/slices/dataPermissionsSlice.tsx

Data-permission dialog state.

organizations

src/redux/slices/organizationsSlice.tsx

Organization data.

ready

src/redux/slices/readySlice.tsx

Global readiness flag.

baseMode

src/redux/slices/baseModeSlice.ts

Base/customer mode state.

dbSettings

src/redux/slices/dbSettingsSlice.ts

Database configuration state.

execSettings

src/redux/slices/execSettingsSlice.tsx

Agent Workbench execution settings.

dataAnalysis

src/redux/slices/dataAnalysisSlice.ts

Data-analysis state.

appSettingsFileUpload

src/redux/slices/appSettingsFileUploadSlice.ts

Configuration file upload state.

appRelease

src/redux/slices/appReleaseSlice.tsx

Production/test release marker.

userProfile

src/redux/slices/userProfileSlice.ts

OIDC user profile data.

developerConsole

src/redux/slices/developerConsoleSlice.ts

Developer-console UI state.

liveConsole

src/redux/slices/liveConsoleSlice.ts

Live-console state and communication.

The remaining files should be classified in a few coherent batches instead ofbeing moved one by one.

Non-slice files in the legacy slice folder

The following files are not normal reducer slices and should eventually move totheir owning module:

src/redux/slices/Data.ts
src/redux/slices/PostLoginUpdateWatcher.tsx
src/redux/slices/UpdateNotificationWatcher.tsx
src/redux/slices/reloadUpdatedFrontendWebApp.ts

Their current location is legacy organization, not an architectural decision.

Initialization flow

The root application currently initializes shared state in this order:

initializeServers

initializeLanguage

initializeTheme

initializeApi

initializeDataPermissions

initializeOrganizations

initializeMenu

This makes server and API information available before dynamic menu loading.

API client rebuilds

apiSlice builds generated clients from the active base URL and authenticationstate.

For JWT:

Authorization: Bearer <jwt>

For OIDC:

withCredentials: true

OIDC sessions use browser cookies rather than a frontend-managed bearer token.

apiSlice is a known transition module because it currently also knowstemplate navigation. A final refactor must remove upward layer dependenciesbefore placing it in core.

Menu state

The menu state is owned by the template:

src/template/state/navigation/menuSlice.tsx

Navigation configuration is separate from state:

src/template/navigation/menu/staticMenu.tsx
src/template/navigation/menu/featureFlags.ts
src/template/navigation/tabs/staticTabs.tsx
src/template/navigation/tabs/tabFeatureFlags.tsx
src/template/navigation/tabs/withAutoTabs.tsx

staticMenu and staticTabs are registries, not reducers.

Notifications

Notification state is owned by:

src/template/state/notifications/notificationSlice.ts

Notifications are grouped by a normalized server key. Selectors exposenotifications and unread counts for the active server.

The slice has targeted Jest coverage under:

test/notificationSlice.test.ts

Server state

Reusable shell state is split by concern:

src/template/state/server/serverSlice.ts
src/template/state/server/serverStatusSlice.ts
src/template/state/connectivity/connectivitySlice.tsx

Shared server types and validation logic live in src/core/server.

Authentication state

The initial password dialog is reusable UI state:

src/template/state/authentication/passwordChangePromptSlice.ts

The main authentication state remains in apiSlice.tsx until its API,authentication, server, storage and navigation responsibilities are separated.

The session-time slice also remains transitional because Core session hookscurrently consume it while it depends on the concrete RootState andapiSlice.

Import policy

Prefer stable aliases for cross-folder imports:

import type { RootState } from "@/redux/store";
import { selectTheme } from "@/template/state/theme/themeSlice";
import { Card } from "@design-system";

Do not replace every relative import blindly. Use exact search-and-replace fora verified old path.

Validation workflow

After moving state:

git grep -n "<old-path>" -- .
npx tsc --noEmit
npx jest --runTestsByPath <affected-test>
npx expo start --clear

Then commit the completed batch.

Open decisions

Move root reducer/store composition into the application composition layer.

Revisit the final location of typed Redux hooks.

Separate apiSlice into focused authentication, API-client, server andpersistence responsibilities.

Extract session HTTP communication from sessionTimeSlice.

Classify the remaining feature slices into template or application.

Add public layer APIs and automated import-boundary checks.