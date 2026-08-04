Authentication

The template supports two authentication modes against an Agent.Workbenchbackend:

JWT / Basic-login authentication

OIDC / browser-cookie authentication

Authentication is being separated into reusable Core infrastructure, reusableTemplate UI and transitional Redux composition.

Layer ownership

template authentication UI
            â†“
core authentication capabilities
            â†“
server and HTTP communication

Rules:

authentication screens and dialogs belong to template

reusable authentication behavior belongs to core

product-specific authentication customization belongs to application

core must not import from template

store composition remains transitional until the application layer owns it

Canonical authentication type

The shared authentication method is defined in:

src/core/authentication/types.ts

export type AuthMethod = "jwt" | "oidc" | "unknown";

apiSlice.tsx may temporarily re-export this type for compatibility while oldimports are migrated. New Core imports must use the canonical Core type.

Central files

File

Purpose

src/core/authentication/types.ts

Shared AuthMethod type.

src/template/state/api/apiSlice.tsx

Transitional authentication/API/server state and generated API clients.

src/redux/slices/sessionTimeSlice.tsx

Transitional OIDC session state and session-time HTTP requests.

src/template/state/authentication/passwordChangePromptSlice.ts

Initial password-change dialog state.

src/template/screens/login/

Login and authentication presentation.

src/core/server/serverCheck.ts

Server reachability, authentication detection and backend-settings parsing.

src/core/server/types.ts

Shared server result and environment types.

src/core/authentication/http/attachAuthInterceptors.tsx

Authentication interceptors for API communication.

src/core/authentication/jwt/jwtRenewSlice.tsx

JWT renewal behavior and state.

src/core/authentication/session/AppSessionGuard.tsx

Guards the application against invalid sessions.

src/core/authentication/session/useJwtSessionTimerWeb.ts

JWT timer and renewal coordination.

src/core/authentication/session/useOidcSessionTimerWeb.ts

OIDC session timer and expiration handling.

src/core/authentication/session/useSessionActivityWeb.tsx

Session extension after meaningful activity.

src/core/authentication/logout/logoutFlowGuard.ts

Prevents unwanted side effects during logout.

src/core/authentication/logout/logoutServers.ts

Reusable multi-server logout orchestration.

Authentication method detection

Authentication information is read from:

GET /api/app/settings/get

Relevant settings include:

_AuthenticationMethod
_ServerWideSecurityConfiguration
_Authenticated
_session.id
_session.pathParameter
_oidc.*
_oidc.bearer
_oidc.access_token

The result is normalized to:

"jwt" | "oidc" | "unknown"

The reusable detection logic belongs to the Core server module. The selectedmethod and active API clients are still stored in the transitional apiSlice.

JWT login

JWT authentication uses:

GET /api/user/login
Authorization: Basic <base64(username:password)>

The bearer token may be returned in a response header or response body.

JWTs are stored per normalized server key through the jwtByServer map. Thisallows server switching without discarding authenticated JWT sessions for otherconfigured servers.

Generated API clients receive:

Authorization: Bearer <jwt>

OIDC login

OIDC starts through:

<server-base-url>/login

For a same-origin deployment, the browser can navigate directly to the serverlogin.

During Expo Web development, a popup can be used while the frontend polls thebackend until the OIDC session is authenticated.

OIDC uses browser cookies. Generated clients use:

withCredentials: true

When OIDC is active, frontend JWT state for the selected server must not be usedas the active authentication mechanism.

Logout behavior

JWT logout calls the backend logout endpoint and then clears localauthentication state.

OIDC logout uses browser navigation to:

<server-base-url>/api/user/logout

This allows the identity provider to complete redirect-based logout.

Reusable logout orchestration lives under:

src/core/authentication/logout

Template UI is responsible only for user interaction and presentation.

Session handling

OIDC session information is loaded from:

GET /api/user/sessionTime

The session is extended through:

GET /api/user/sessionTime/extend

useSessionActivityWeb extends the session only after meaningful interaction,for example:

button clicks

navigation

keyboard input

Logout controls can be excluded from automatic extension.

Current Core structure

src/core/authentication
â”œâ”€â”€ http
â”‚   â””â”€â”€ attachAuthInterceptors.tsx
â”œâ”€â”€ jwt
â”‚   â””â”€â”€ jwtRenewSlice.tsx
â”œâ”€â”€ logout
â”‚   â”œâ”€â”€ logoutFlowGuard.ts
â”‚   â””â”€â”€ logoutServers.ts
â”œâ”€â”€ session
â”‚   â”œâ”€â”€ AppSessionGuard.tsx
â”‚   â”œâ”€â”€ useJwtSessionTimerWeb.ts
â”‚   â”œâ”€â”€ useOidcSessionTimerWeb.ts
â”‚   â””â”€â”€ useSessionActivityWeb.tsx
â””â”€â”€ types.ts

Important behavior

Connectivity checks never perform logout.

OIDC redirects are authentication events, not connectivity failures.

JWT renewal is disabled for an active OIDC server.

Server switching rebuilds API clients with the selected server and correctauthentication configuration.

Reusable authentication behavior should not be implemented inside screens.

Core authentication code must not depend on Template UI.

Known transition dependencies

The architecture is not fully separated yet.

apiSlice.tsx

It currently combines:

authentication state

active server URL

generated API clients

JWT persistence

server switching

runtime configuration

template menu initialization

Because it imports template navigation, it cannot be moved unchanged intocore.

sessionTimeSlice.tsx

It currently combines:

Redux session state

direct fetch requests

active server selection through apiSlice

concrete RootState selectors

Core session guards consume this slice. A final refactor should extract the HTTPservice and define a clean state/composition boundary before moving it.

Next steps

Keep AuthMethod canonical in src/core/authentication/types.ts.

Remove remaining Core imports from apiSlice where focused Core services ortypes already exist.

Extract session-time HTTP calls from sessionTimeSlice.

Separate apiSlice responsibilities.

Move authentication composition to the application layer.

Add a public Core authentication API.

Add an automated rule that prevents core from importing template.
