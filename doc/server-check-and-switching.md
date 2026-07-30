Server Check and Server Switching

The template manages multiple Agent.Workbench backend servers and can switchbetween them at runtime.

Reusable server validation and detection belong to src/core/server. Reusableserver-selection UI state belongs to src/template/state/server.

Layer ownership

template server UI and state
            ↓
core server validation and types
            ↓
backend endpoints

The Core server module must not depend on Template UI.

Central files

File

Purpose

src/template/state/server/serverSlice.ts

Stores configured servers and the active environment.

src/template/state/server/serverStatusSlice.ts

Per-server UI status metadata.

src/template/state/connectivity/connectivitySlice.tsx

Active-server /api/alive connectivity state.

src/redux/slices/apiSlice.tsx

Transitional active base URL, authentication and API-client state.

src/core/server/serverCheck.ts

Reachability, authentication detection and backend-settings parsing.

src/core/server/serverValidation.ts

Reusable server validation.

src/core/server/normalizeServerInputs.ts

Normalizes server input values.

src/core/server/detectServerEnvironment.ts

Determines the server environment.

src/core/server/types.ts

Shared server result and environment types.

src/template/components/layout/Footer.tsx

Server selection, notifications and release information.

src/template/screens/server/

Server settings, switching and offline presentation.

Shared types

The canonical environment type is defined in:

src/core/server/types.ts

export type ServerEnvironment = "DEV" | "TEST" | "PROD";

Server state may re-export this type temporarily for compatibility, but Corecode should import it from the Core type module.

A configured server uses the following conceptual model:

type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: ServerEnvironment;
};

Persistence

Configured servers are stored in AsyncStorage under:

servers

If no configuration exists, a default local server is created.

For a deployed web application, the runtime origin may replace the defaultlocalhost backend.

Reachability check

Reachability is checked through:

GET /api/alive

The check answers only:

Can the frontend reach the backend?

Any HTTP response proves reachability, including:

successful responses

authentication errors

redirects

backend errors

A connectivity check must never decide that the user should be logged out.

Authentication detection

Authentication and selected application settings are read from:

GET /api/app/settings/get

The Core server module evaluates the backend response to determine:

authentication method

authenticated state

application release information

available security configuration

The shared authentication type comes from:

src/core/authentication/types.ts

Server switching flow

The current switching flow is:

The user selects a configured server.

The base URL is normalized.

Stored JWT information is loaded for that server.

Core server checks validate reachability and backend settings.

Authentication information is evaluated.

Generated API clients are rebuilt.

Active authentication and server state are updated.

Template menus are reloaded when required.

The validation functions are reusable and independent from the Login screen.

Server state

Saved servers

src/template/state/server/serverSlice.ts

Responsibilities:

configured server list

active environment

server persistence and initialization

Status metadata

src/template/state/server/serverStatusSlice.ts

Conceptual model:

type ServerStatusMeta = {
  tone: "green" | "yellow" | "red";
  subtitle: string;
};

This data is presentation metadata for the server selection UI.

Connectivity

src/template/state/connectivity/connectivitySlice.tsx

Connectivity checks can be triggered:

after login

periodically

when the browser becomes active again

The current interval is 40 seconds.

The offline overlay reads this state and presents the result. It does not ownthe reachability algorithm.

Current Core structure

src/core/server
├── detectServerEnvironment.ts
├── normalizeServerInputs.ts
├── serverCheck.ts
├── serverValidation.ts
└── types.ts

Known transition dependency

apiSlice.tsx still combines active server state, API-client construction,authentication, persistence and template menu initialization.

Because it knows Template navigation, it cannot be moved unchanged into Core.The final solution should separate:

server selection

API-client construction

authentication state

persistence

application/template orchestration

Normalization rule

Use one shared Core normalization implementation for server URLs. Avoid addingnew local normalizeBaseUrl implementations.

Existing duplicate or compatibility exports should be consolidated during theapiSlice separation.

Validation workflow

After server-state moves:

git grep -n -E "redux/slices/serverSlice|redux/slices/serverStatusSlice" -- .
git grep -n "redux/slices/connectivitySlice" -- .
npx tsc --noEmit
npx expo start --clear

Run targeted tests when the affected module has Jest coverage.

Next steps

Keep server state under src/template/state/server.

Keep reusable checks and types under src/core/server.

Consolidate URL normalization.

Separate the server responsibilities currently inside apiSlice.

Move concrete composition into application.

Add a public Core server API and dependency-boundary checks.