# Authentication

## Purpose

This document describes the authentication architecture of `web.template`, including:

* JWT authentication
* OpenID Connect (OIDC)
* session handling
* logout behavior
* server switching
* architectural ownership
* current technical decomposition areas

The Template supports two authentication mechanisms against compatible Agent.Workbench backend servers:

```text
JWT / Basic login
OIDC / browser-cookie authentication
```

Authentication is separated by responsibility.

The architecture follows:

```text
Application --> Template --> Core
```

Standard Agent.Workbench authentication behavior belongs to the reusable Base Template.

---

# 1. Architecture

Authentication follows the general dependency direction:

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
Technical authentication capability
    -> Core

Reusable authentication UI/state/orchestration
    -> Template

Concrete product-specific authentication configuration
    -> Application
```

Core must not import Template or Application.

Template must not import concrete Application implementation.

---

# 2. Agent.Workbench Authentication Ownership

Standard Agent.Workbench authentication behavior is Template-owned.

This includes reusable behavior such as:

```text
Login UI
JWT login orchestration
OIDC browser-session orchestration
session guards
session timers
logout orchestration
server-aware authentication state
password-change UI
authenticated-user profile state
```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Therefore standard Agent.Workbench authentication must not be classified as functionality waiting to move into a separate Agent.Workbench Application repository.

---

# 3. Authentication Responsibilities

## Core

Core owns authentication functionality that can operate without depending on React UI, Template Redux state or concrete product composition.

Examples include:

* shared authentication types
* technical HTTP authentication behavior
* authentication-related transport helpers
* logout-flow protection
* server authentication detection
* reusable technical utilities

## Template

Template owns reusable authentication behavior that depends on the application shell, Redux state, React hooks or reusable UI.

Examples include:

* Login screens
* password-change dialogs
* session guards
* JWT renewal orchestration
* OIDC session timers
* session activity tracking
* logout orchestration
* authentication Redux state
* user-profile state
* active authentication mechanism coordination

## Application

Application owns concrete product-specific authentication behavior only when genuinely required.

Examples may include:

```text
product-specific authentication metadata
consumer-specific identity-provider configuration
consumer-only authentication rules
```

The Base Template must not import authentication configuration from a concrete Application.

---

# 4. Current Authentication Structure

The current authentication implementation is split between Core and Template.

## Core

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

Server-side authentication detection is part of reusable server infrastructure:

```text
src/core/server/
+-- serverCheck.ts
+-- types.ts
+-- ...
```

## Template

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

# 5. Shared Authentication Type

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

Technical code should use the shared Core type where appropriate.

Template state may expose or reuse this type as part of its state contract.

Competing authentication-method types should not be introduced in multiple layers without a clear reason.

---

# 6. Authentication Detection

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

Reusable server authentication detection belongs to:

```text
src/core/server/serverCheck.ts
```

The selected authentication method is then consumed by Template state and orchestration.

---

# 7. Detection Fallbacks

Authentication detection must support backend behavior where the method is not available through one explicit setting.

OIDC may also be recognized through signals such as:

* HTTP redirects
* OIDC-related backend settings
* session-related settings
* OIDC bearer information
* non-JSON authentication responses

JWT authentication may be recognized through authentication settings or authorization-related backend responses.

Detection must remain centralized.

Screens must not independently reimplement authentication-method detection.

---

# 8. JWT Login

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

Subsequent authenticated API requests use:

```text
Authorization: Bearer <jwt>
```

JWT login is frontend-managed authentication.

---

# 9. JWT Storage

JWTs are stored per normalized server.

Conceptually:

```text
jwtByServer = {
  "<normalized-server-url>": "<jwt>"
}
```

This allows switching between configured backend servers without automatically discarding authenticated JWT sessions for other servers.

The currently selected server determines which JWT becomes active.

When the selected server uses OIDC, stored JWT state must not become the active authentication mechanism.

---

# 10. JWT API Configuration

Generated API clients receive an authorization header when:

```text
authentication method = JWT
and
JWT is available
```

Conceptually:

```text
Authorization: Bearer <jwt>
```

Active API clients are rebuilt when relevant server or authentication state changes.

JWT handling currently participates in:

```text
src/template/state/api/apiSlice.tsx
```

`apiSlice.tsx` still combines several technical and application-platform responsibilities.

This is a technical decomposition concern.

It does not imply that the slice is concrete Agent.Workbench Application state.

---

# 11. OIDC Login

OIDC authentication starts through:

```text
<server-base-url>/login
```

OIDC is browser-oriented authentication.

For same-origin deployments, the browser may navigate directly to the server login endpoint.

During local Expo Web development, authentication may use browser navigation or a popup-based flow while the frontend checks whether the backend session has become authenticated.

OIDC authentication is primarily cookie-based.

---

# 12. OIDC API Communication

OIDC generated API clients use browser credentials.

Conceptually:

```ts
withCredentials: true
```

The browser manages authentication cookies.

The frontend must not require an Application-managed JWT when the active authentication method is OIDC.

When switching to an OIDC server, stale JWT state must not become the active authentication mechanism.

---

# 13. Authentication State

The main API/authentication coordination currently lives in:

```text
src/template/state/api/apiSlice.tsx
```

Current responsibilities include:

* active server URL
* authentication method
* JWT state
* login state
* generated API clients
* JWT persistence
* server switching
* logout-related state
* runtime API configuration

This is a broad responsibility set.

Further technical decomposition may be useful.

The module must not be moved unchanged into Core because it depends on Template state and application-platform orchestration.

---

# 14. Session State

OIDC session state currently lives in:

```text
src/template/state/session/sessionTimeSlice.ts
```

The `sessionTime` reducer belongs to Template state.

Session state contains information required to track the active backend session.

The slice may still combine state with backend communication.

Any future separation should follow responsibility.

Reusable Redux state remains Template-owned.

Pure technical communication may move only if it can be separated without introducing upward dependencies.

---

# 15. Session Endpoints

OIDC session information is loaded through:

```text
GET /api/user/sessionTime
```

The backend session can be extended through:

```text
GET /api/user/sessionTime/extend
```

The session state is consumed by reusable Template session orchestration.

---

# 16. Application Session Guard

The reusable session guard is located at:

```text
src/template/authentication/session/AppSessionGuard.tsx
```

It belongs to Template because it coordinates:

* application-shell behavior
* authentication state
* session state
* Redux state

The guard prevents normal application operation when authentication or session state is no longer valid.

It must distinguish authentication failure from connectivity failure.

---

# 17. JWT Session Timer

JWT session behavior is coordinated by:

```text
src/template/authentication/session/useJwtSessionTimerWeb.ts
```

JWT sessions use token lifetime and renewal behavior rather than the OIDC browser-session model.

JWT renewal orchestration currently lives under:

```text
src/template/authentication/jwt/jwtRenewThunks.ts
```

It belongs to Template because it depends on Redux/application state.

Pure JWT utilities may belong to Core when they have no Template dependency.

---

# 18. OIDC Session Timer

OIDC session timing is coordinated by:

```text
src/template/authentication/session/useOidcSessionTimerWeb.ts
```

The hook works with Template session state.

OIDC session expiration must not be treated as a generic connectivity failure.

The backend may remain reachable even after browser authentication expires.

---

# 19. Session Activity

Meaningful user activity is handled through:

```text
src/template/authentication/session/useSessionActivityWeb.tsx
```

The activity hook may extend the OIDC session after meaningful interaction.

Examples include:

* button interaction
* navigation
* keyboard input
* other intentional user interaction

Passive rendering must not continuously extend the session.

Logout actions and logout dialogs may intentionally be excluded from automatic session extension.

---

# 20. TemplateApp Integration

Authentication and session orchestration are integrated into the reusable Template application platform.

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
Reusable application platform
```

This is why these orchestration components belong to Template rather than Core.

---

# 21. Password Change State

Reusable initial-password-change state lives at:

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

This state belongs to Template because it controls reusable application-platform UI.

---

# 22. User Profile State

Reusable authenticated-user profile state lives at:

```text
src/template/state/authentication/userProfileSlice.ts
```

Generic authenticated-user information can remain Template-owned.

Concrete product-specific profile extensions belong to Application.

Ownership follows responsibility rather than the word `profile`.

---

# 23. Logout

Logout differs between JWT and OIDC.

## JWT Logout

JWT logout performs backend logout while the current JWT remains available.

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

The JWT must remain available long enough to perform the authenticated backend logout request.

## OIDC Logout

OIDC logout uses real browser navigation.

Target:

```text
<server-base-url>/api/user/logout
```

Browser navigation is important because the identity provider may require redirects during logout.

A background `fetch` is not always sufficient.

---

# 24. Logout Infrastructure

Reusable logout orchestration includes:

```text
src/template/authentication/logout/logoutServers.ts
```

Technical logout protection exists in:

```text
src/core/authentication/logout/logoutFlowGuard.ts
```

Ownership:

```text
Technical logout protection
    -> Core

Redux/application orchestration
    -> Template

Logout presentation
    -> Template
```

---

# 25. Connectivity and Authentication

Connectivity and authentication are separate concepts.

Important rules:

```text
Server unreachable != user logged out

Authentication expired != network offline

OIDC redirect != connectivity failure
```

Connectivity checks must not trigger logout merely because a backend request fails.

Authentication state should be changed by authentication/session logic.

This distinction is especially important during:

* server switching
* backend restart
* temporary network interruption

---

# 26. Server Switching

When switching servers, Template rebuilds the active API configuration for the selected server.

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

Server-selection orchestration belongs to Template.

Technical server detection belongs to Core.

---

# 27. API Client Rebuild

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

API clients must represent the currently selected server and active authentication mechanism.

---

# 28. Current Ownership Summary

Authentication ownership is:

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
+-- authentication Redux state
+-- user-profile state
+-- password-change state
+-- session state
+-- session guards
+-- JWT renewal orchestration
+-- OIDC session orchestration
+-- session activity
+-- logout orchestration
+-- API-client coordination

Application
|
+-- concrete product-specific authentication configuration
   where genuinely required
```

Anything that depends on Redux, Template UI or application-platform orchestration must not be moved into Core merely because it is authentication-related.

---

# 29. Technical Decomposition Areas

Authentication ownership is established, but some modules still combine multiple technical responsibilities.

This is technical decomposition work, not Agent.Workbench Application extraction.

## apiSlice

```text
src/template/state/api/apiSlice.tsx
```

currently combines:

* authentication state
* active server state
* generated API clients
* JWT persistence
* server switching
* login state
* logout state
* runtime API configuration

These responsibilities may be separated incrementally.

The slice must not be moved unchanged into Core.

## sessionTimeSlice

```text
src/template/state/session/sessionTimeSlice.ts
```

combines session state with session operations.

A future refactoring may isolate pure HTTP communication while leaving reusable Redux state in Template.

## JWT Renewal

JWT renewal currently remains in Template because it depends on active Redux/application state.

A technical helper may move to Core only after removing upward Template dependencies.

---

# 30. What Technical Decomposition Does Not Mean

The following conclusions must not be drawn from the decomposition work:

```text
apiSlice must move into Application

sessionTimeSlice is Agent.Workbench Application state

authentication UI should move out of Template

Agent.Workbench authentication requires a separate repository

standard authentication functionality is transitional Application code
```

Standard Agent.Workbench authentication remains Template-owned.

---

# 31. Authentication and Concrete Applications

A concrete Application such as HEMS may consume the reusable authentication platform.

Conceptually:

```text
HEMS Application
        |
        v
Template authentication platform
        |
        v
Core authentication capabilities
```

HEMS-specific authentication behavior belongs to HEMS only when it is genuinely product-specific.

Template must not import HEMS authentication implementation.

---

# 32. Application Configuration

Developer-facing Application configuration is located under:

```text
src/application/config/
```

The current general configuration model is:

```text
application.properties
features.properties
navigation.properties
```

Authentication configuration should only become Application-owned when it represents a concrete consumer requirement.

Do not introduce product-specific authentication configuration into Template merely to support one future consumer.

---

# 33. Architecture Rules

Authentication changes must respect these rules:

1. Core must not import Template or Application.
2. Template must not import concrete Application implementation.
3. Authentication screens belong to Template.
4. Redux-dependent authentication orchestration belongs to Template.
5. Pure technical authentication capabilities may belong to Core.
6. Concrete product-specific authentication behavior belongs to Application.
7. Standard Agent.Workbench authentication remains Template-owned.
8. Connectivity checks must not cause logout.
9. OIDC redirects must not be treated as connectivity failures.
10. JWT renewal must not act as the active authentication mechanism for an OIDC server.
11. Server switching must rebuild authentication-aware API clients.
12. Screens must not duplicate reusable authentication detection logic.
13. Technical module decomposition must not reverse architecture dependencies.

---

# 34. Validation

After changing authentication code, search relevant dependencies.

Examples:

```bash
git grep -n "AuthMethod" -- src
git grep -n "sessionTimeSlice" -- src
git grep -n "AppSessionGuard" -- src
git grep -n "useOidcSessionTimerWeb" -- src
git grep -n "useJwtSessionTimerWeb" -- src
```

Run configuration generation when relevant:

```bash
npm run config:generate
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run targeted authentication/API tests.

For example:

```bash
npx jest test/apiSlice.test.ts --runInBand
```

Validate the patch:

```bash
git diff --check
git status --short
```

When runtime authentication behavior changes, start through the normal npm path:

```bash
npm start
```

---

# 35. Future Technical Work

Potential future work includes:

* further separate `apiSlice` responsibilities
* review session HTTP communication separately from session Redux state
* keep shared authentication types independent from Template
* keep Redux-dependent session orchestration inside Template
* define supported public authentication APIs for concrete consumers
* review consumer-specific authentication configuration when required
* maintain dependency-boundary checks
* ensure Core never imports Template
* validate JWT and OIDC behavior through a concrete consumer such as HEMS

Do not move authentication modules simply to produce a visually cleaner directory tree.

Move functionality only when responsibility and dependencies justify it.

---

# 36. Incorrect Legacy Interpretation

The following statements do not describe the accepted architecture:

```text
"Agent.Workbench authentication must move into Application."

"Authentication inside Template is transitional Agent.Workbench code."

"apiSlice is waiting to move into an Agent.Workbench repository."

"Login screens are concrete Agent.Workbench screens."

"Session state belongs to Application because it is used by Agent.Workbench."
```

The correct ownership is:

```text
technical authentication capability
    -> Core

standard reusable authentication platform
    -> Template

concrete consumer-only authentication behavior
    -> Application
```

---

# 37. Success Criteria

Authentication architecture is correct when:

1. Core authentication code has no Template dependencies.
2. Reusable authentication UI and Redux orchestration are clearly Template-owned.
3. Standard Agent.Workbench authentication remains Template-owned.
4. Concrete product-specific authentication behavior remains Application-owned.
5. JWT and OIDC remain supported through one reusable Base Template.
6. Connectivity and authentication state remain independent.
7. Server switching preserves the correct authentication mechanism.
8. JWT state remains server-specific.
9. OIDC uses browser-session authentication correctly.
10. Session guards and timers do not introduce upward dependencies.
11. Technical decomposition does not become Application extraction.
12. A concrete consumer can use authentication through supported Base Template APIs without modifying Template internals.

---

# 38. Summary

Authentication follows:

```text
Application --> Template --> Core
```

Core owns technical authentication capabilities.

Template owns reusable authentication UI, state and orchestration.

Standard Agent.Workbench authentication belongs to Template.

Concrete Applications may add product-specific authentication behavior where required.

`apiSlice.tsx` and related state may still benefit from technical decomposition, but this does not make them transitional Application code and does not require a separate Agent.Workbench Application repository.
