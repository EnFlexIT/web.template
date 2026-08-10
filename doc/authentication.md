# Authentication

This document describes the authentication architecture of `web.template`,
including JWT authentication, OpenID Connect (OIDC), session handling,
logout behavior, architectural ownership, and the current migration state.

The Template supports two authentication mechanisms against an
Agent.Workbench backend:

```text
JWT / Basic login
OIDC / browser-cookie authentication
```

Authentication is separated according to responsibility rather than being
treated as one monolithic feature.

---

## 1. Architecture

The general dependency direction is:

```text
Application --> Template --> Core
```

Authentication follows the same rule.

Conceptually:

```text
Application
    |
    v
Template authentication UI and orchestration
    |
    v
Core technical authentication capabilities
    |
    v
Server and HTTP communication
```

General ownership:

```text
Technical authentication capability --> Core
Reusable authentication UI/state    --> Template
Product-specific configuration       --> Application
```

Core must not import Template or Application code.

---

## 2. Authentication Responsibilities

### Core

Core owns authentication functionality that is reusable without depending on
React UI, Redux composition, or concrete application state.

Examples include:

- Shared authentication types
- Technical HTTP authentication behavior
- Authentication-related transport helpers
- Logout-flow protection
- Server authentication detection
- Reusable technical utilities

### Template

Template owns reusable authentication behavior that depends on the
application shell, Redux state, React hooks, or reusable UI.

Examples include:

- Login screens
- Password-change dialogs
- Session guards
- JWT renewal orchestration
- OIDC session timers
- Session activity tracking
- Logout orchestration
- Authentication Redux state
- User profile state

### Application

Application owns product-specific authentication configuration when such
configuration is required.

The Base Template must not import authentication configuration from a
concrete application.

---

## 3. Current Authentication Structure

The current authentication implementation is split between Core and Template.

### Core

```text
src/core/authentication/
+-- http/
|   +-- attachAuthInterceptors.tsx
|
+-- logout/
|   +-- logoutFlowGuard.ts
|
+-- types.ts
```

Server-side authentication detection is part of the reusable server
infrastructure:

```text
src/core/server/
+-- serverCheck.ts
+-- types.ts
+-- ...
```

### Template

```text
src/template/authentication/
+-- jwt/
|   +-- jwtRenewThunks.ts
|
+-- logout/
|   +-- logoutServers.ts
|
+-- session/
    +-- AppSessionGuard.tsx
    +-- useJwtSessionTimerWeb.ts
    +-- useOidcSessionTimerWeb.ts
    +-- useSessionActivityWeb.tsx
```

Authentication-related Redux state includes:

```text
src/template/state/api/apiSlice.tsx
src/template/state/session/sessionTimeSlice.ts
src/template/state/authentication/passwordChangePromptSlice.ts
src/template/state/authentication/userProfileSlice.ts
```

Authentication screens are located under:

```text
src/template/screens/login/
```

---

## 4. Shared Authentication Type

The canonical shared authentication type is defined in:

```text
src/core/authentication/types.ts
```

Conceptually:

```ts
export type AuthMethod =
  | "jwt"
  | "oidc"
  | "unknown";
```

Technical code should use the shared Core type where possible.

Template state may expose or reuse this type as part of its public state
contract.

The long-term goal is to avoid defining competing authentication-method types
in multiple layers.

---

## 5. Authentication Detection

Authentication information is detected when checking the selected backend.

The server settings endpoint is:

```text
GET /api/app/settings/get
```

Relevant backend settings may include:

```text
_AuthenticationMethod
_ServerWideSecurityConfiguration
_Authenticated
_session.id
_session.pathParameter
_oidc.*
_oidc.bearer
_oidc.access_token
```

The frontend normalizes the authentication method to:

```text
jwt
oidc
unknown
```

The reusable server detection belongs to:

```text
src/core/server/serverCheck.ts
```

The selected authentication method is stored in the Template API state.

---

## 6. Detection Fallbacks

Authentication detection must also handle backend behavior where the
authentication method is not available as one explicit setting.

OIDC may also be recognized through signals such as:

- HTTP redirect responses
- OIDC-related backend settings
- Session-related settings
- OIDC bearer information
- A non-JSON authentication response

JWT authentication may be recognized through authentication settings or
authorization-related backend responses.

Detection logic must remain centralized.

Screens should not independently implement their own authentication-method
detection.

---

## 7. JWT Login

JWT authentication uses the backend login endpoint.

Conceptually:

```text
GET /api/user/login
```

Credentials are sent using HTTP Basic authentication:

```text
Authorization: Basic <base64(username:password)>
```

After successful authentication, the backend provides a JWT.

The frontend uses the JWT for subsequent authenticated API calls:

```text
Authorization: Bearer <jwt>
```

JWT login is frontend-managed authentication.

---

## 8. JWT Storage

JWTs are stored per normalized server.

Conceptually:

```text
jwtByServer = {
  "<normalized-server-url>": "<jwt>"
}
```

This allows the user to switch between configured Agent.Workbench servers
without automatically losing authenticated JWT sessions for other servers.

The currently selected server determines which JWT becomes active.

When the selected server uses OIDC, its frontend JWT must not be treated as
the active authentication mechanism.

---

## 9. JWT API Configuration

Generated API clients receive an authorization header when JWT authentication
is active and a JWT is available.

Conceptually:

```text
Authorization: Bearer <jwt>
```

The active API clients are rebuilt when relevant authentication or server
state changes.

JWT handling currently participates in:

```text
src/template/state/api/apiSlice.tsx
```

This module remains a complex transitional module because it combines several
responsibilities.

---

## 10. OIDC Login

OIDC authentication starts through:

```text
<server-base-url>/login
```

OIDC is browser-oriented authentication.

For same-origin deployments, the browser can navigate directly to the server
login endpoint.

During local Expo Web development, authentication may use browser navigation
or a popup-based flow while the frontend checks whether the backend session
has become authenticated.

OIDC authentication is primarily cookie-based.

---

## 11. OIDC API Communication

OIDC generated API clients use browser credentials.

Conceptually:

```ts
withCredentials: true
```

The browser manages the authentication cookies.

The frontend must not require an application-managed JWT when the active
authentication method is OIDC.

When switching to an OIDC server, stale JWT state for that server must not
become the active authentication mechanism.

---

## 12. Authentication State

The main API and authentication state currently lives in:

```text
src/template/state/api/apiSlice.tsx
```

Important responsibilities currently include:

- Active server URL
- Authentication method
- JWT state
- Login state
- Generated API clients
- JWT persistence
- Server switching
- Logout-related state
- Runtime API configuration

This is still a broad responsibility set.

The module should not be moved into Core unchanged because it depends on
Template state and application-shell orchestration.

---

## 13. Session State

OIDC session state currently lives in:

```text
src/template/state/session/sessionTimeSlice.ts
```

The `sessionTime` reducer is part of the current Template store composition.

Session state includes information required to track the currently active
backend session.

The current session slice may still combine Redux state with backend
communication.

Further separation should be based on responsibility rather than moving the
whole slice into Core.

---

## 14. Session Endpoints

OIDC session information is loaded through:

```text
GET /api/user/sessionTime
```

The backend session can be extended through:

```text
GET /api/user/sessionTime/extend
```

The session state is used by the reusable Template session orchestration.

---

## 15. Application Session Guard

The reusable application session guard is located at:

```text
src/template/authentication/session/AppSessionGuard.tsx
```

It belongs to Template because it coordinates application-shell behavior and
Redux state.

Its responsibility is to prevent the application from continuing normally
when authentication or session state is no longer valid.

The guard must distinguish authentication failure from connectivity failure.

---

## 16. JWT Session Timer

JWT session handling is coordinated by:

```text
src/template/authentication/session/useJwtSessionTimerWeb.ts
```

JWT sessions use token lifetime and renewal behavior rather than the OIDC
browser-session mechanism.

JWT renewal orchestration currently lives under:

```text
src/template/authentication/jwt/jwtRenewThunks.ts
```

It belongs to Template because it participates in Redux and application-shell
state.

Pure JWT utilities may still belong in Core when they have no Template
dependency.

---

## 17. OIDC Session Timer

OIDC session timing is coordinated by:

```text
src/template/authentication/session/useOidcSessionTimerWeb.ts
```

The hook works with the Template session state.

OIDC session expiration must not be treated as a generic connectivity
failure.

The backend may still be reachable even when the browser authentication
session has expired.

---

## 18. Session Activity

Meaningful user activity is handled through:

```text
src/template/authentication/session/useSessionActivityWeb.tsx
```

The activity hook may extend the OIDC session after meaningful interaction.

Examples include:

- Button interaction
- Navigation
- Keyboard input
- Other intentional user interaction

Passive rendering should not continuously extend the session.

Logout actions and logout dialogs may intentionally be excluded from
automatic session extension.

---

## 19. TemplateApp Integration

Authentication and session orchestration are integrated into the reusable
Template application shell.

Conceptually:

```text
TemplateApp
    |
    +-- authentication state
    +-- AppSessionGuard
    +-- session activity
    +-- JWT session timer
    +-- OIDC session timer
    |
    v
Reusable application shell
```

This is one reason why these orchestration components belong to Template
instead of Core.

---

## 20. Password Change State

The reusable initial-password-change state lives at:

```text
src/template/state/authentication/passwordChangePromptSlice.ts
```

It supports reusable authentication UI such as:

```text
InitialPasswordChangeDialog
Login
ServerLoginModal
Footer
```

The state belongs to Template because it controls reusable application-shell
UI.

---

## 21. User Profile State

Reusable authenticated-user profile state lives at:

```text
src/template/state/authentication/userProfileSlice.ts
```

The final ownership should remain based on whether the profile represents
generic authenticated-user information or product-specific user data.

Generic authenticated-user state can remain Template-owned.

Product-specific profile extensions belong to Application.

---

## 22. Logout

Logout behavior differs between JWT and OIDC.

### JWT logout

JWT logout performs backend logout while the current JWT is still available.

After backend logout, local JWT and authentication state can be cleared.

Conceptually:

```text
backend logout
    |
    v
remove stored JWT
    |
    v
clear local authentication state
```

### OIDC logout

OIDC logout uses real browser navigation.

The target is:

```text
<server-base-url>/api/user/logout
```

Browser navigation is important because the identity provider may need to
perform redirects during logout.

A simple background `fetch` is not always sufficient for the OIDC logout
flow.

---

## 23. Logout Infrastructure

Reusable logout orchestration currently includes:

```text
src/template/authentication/logout/logoutServers.ts
```

Technical protection against unwanted logout side effects is located in:

```text
src/core/authentication/logout/logoutFlowGuard.ts
```

This separation reflects the architecture:

```text
Technical logout protection --> Core
Redux/application orchestration --> Template
Logout presentation --> Template UI
```

---

## 24. Connectivity and Authentication

Connectivity and authentication must remain separate concepts.

Important rules:

```text
Server unreachable != user logged out
Authentication expired != network offline
OIDC redirect != connectivity failure
```

Connectivity checks must never perform logout merely because a backend
request fails.

Authentication state should be changed only by authentication or session
logic.

This separation is particularly important for server switching and temporary
network interruptions.

---

## 25. Server Switching

When switching servers, the Template must rebuild the active API
configuration using the selected server.

Conceptually:

```text
select server
    |
    v
detect authentication method
    |
    +-- JWT  --> restore/use server JWT
    |
    +-- OIDC --> use browser session
    |
    v
rebuild generated API clients
```

JWT sessions are stored per normalized server.

OIDC authentication relies on the browser session of the selected backend.

---

## 26. API Client Rebuild

Generated API clients depend on:

```text
active server
authentication method
JWT state
browser credentials
```

For JWT:

```text
Authorization: Bearer <jwt>
```

For OIDC:

```text
withCredentials: true
```

The API clients must always represent the currently selected server and its
active authentication mechanism.

---

## 27. Current Ownership Summary

Current authentication ownership is approximately:

```text
Core
|
+-- authentication types
+-- HTTP authentication helpers
+-- logout-flow guard
+-- server authentication detection

Template
|
+-- Login UI
+-- Authentication Redux state
+-- User profile state
+-- Password-change state
+-- Session state
+-- Session guards
+-- JWT renewal orchestration
+-- OIDC session orchestration
+-- Session activity
+-- Logout orchestration

Application
|
+-- Product-specific authentication configuration
```

This structure is preferable to placing all authentication code inside Core.

Anything that depends on Redux, Template UI, or the Template application shell
should not be moved into Core merely because it is related to authentication.

---

## 28. Current Transitional Areas

Authentication separation is not fully complete.

### apiSlice

`src/template/state/api/apiSlice.tsx` still combines multiple concerns:

- Authentication state
- Active server state
- Generated API clients
- JWT persistence
- Server switching
- Login state
- Logout state
- Runtime API configuration

These responsibilities may be separated further.

The slice must not be moved unchanged into Core.

### sessionTimeSlice

`src/template/state/session/sessionTimeSlice.ts` combines session state with
session operations.

Future refactoring may extract pure HTTP communication while keeping reusable
Redux state in Template.

### JWT renewal

JWT renewal currently lives under Template because it depends on the active
Redux/application state.

Any future extraction into Core must first remove those upward dependencies.

---

## 29. Important Architecture Rules

Authentication changes must respect the following rules:

1. Core must not import Template or Application.
2. Authentication screens belong to Template.
3. Redux-dependent authentication orchestration belongs to Template.
4. Pure reusable authentication capabilities may belong to Core.
5. Product-specific authentication configuration belongs to Application.
6. Connectivity checks must not cause logout.
7. OIDC redirects must not be treated as connectivity failures.
8. JWT renewal must not run as the active authentication mechanism for an
   OIDC server.
9. Server switching must rebuild authentication-aware API clients.
10. Screens must not duplicate reusable authentication detection logic.

---

## 30. Validation

After changing authentication code, search relevant dependencies.

Examples:

```bash
git grep -n "AuthMethod" -- src
git grep -n "sessionTimeSlice" -- src
git grep -n "AppSessionGuard" -- src
git grep -n "useOidcSessionTimerWeb" -- src
git grep -n "useJwtSessionTimerWeb" -- src
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run targeted tests for affected authentication or API modules.

For example:

```bash
npx jest test/apiSlice.test.ts --runInBand
```

Validate the patch:

```bash
git diff --check
```

When runtime authentication behavior changes, start the application through:

```bash
npm start
```

---

## 31. Next Steps

The authentication architecture should continue incrementally.

Planned work includes:

- Further separate `apiSlice` responsibilities.
- Review session HTTP communication separately from session Redux state.
- Keep shared authentication types independent of Template.
- Keep Redux-dependent session orchestration inside Template.
- Define supported public authentication APIs for the Base Template.
- Review application-specific authentication configuration.
- Maintain automated dependency-boundary checks.
- Ensure Core never imports Template.
- Preserve JWT and OIDC behavior during repository separation.

Do not move authentication modules simply to achieve a visually clean folder
tree.

Move them only when their dependencies and responsibilities support the
target architecture.

---

## 32. Success Criteria

Authentication separation is complete when:

1. Core authentication code has no Template dependencies.
2. Reusable authentication UI and Redux orchestration are clearly
   Template-owned.
3. Product-specific authentication configuration is Application-owned.
4. JWT and OIDC remain supported through one reusable Base Template.
5. Connectivity and authentication state remain independent.
6. Server switching preserves the correct authentication mechanism.
7. JWT state remains server-specific.
8. OIDC uses browser-session authentication correctly.
9. Session guards and timers do not create upward architecture dependencies.
10. A concrete application can consume authentication through supported Base
    Template APIs without modifying internal Template code.