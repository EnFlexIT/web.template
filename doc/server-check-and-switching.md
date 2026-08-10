# Server Check and Server Switching

This document describes server configuration, reachability checks, server
validation, authentication detection, runtime server switching, and the
architectural ownership of these responsibilities in `web.template`.

The Template supports multiple Agent.Workbench backend servers and can switch
between them at runtime.

The architecture follows:

```text
Application --> Template --> Core
```

Server functionality is separated according to responsibility.

---

## 1. Architecture

Conceptually:

```text
Application-specific server configuration
                |
                v
Template server UI and state
                |
                v
Core server validation and technical logic
                |
                v
Backend endpoints
```

General ownership:

```text
Technical server capability --> Core
Reusable server UI/state    --> Template
Product-specific definition --> Application
```

Core must not import Template or Application code.

---

## 2. Core Responsibilities

Reusable technical server logic belongs to Core when it does not depend on
Template UI, Redux composition, or concrete product behavior.

Important Core responsibilities include:

- Server URL normalization
- Server reachability checks
- Server validation
- Authentication-method detection
- Backend settings parsing
- Server environment detection
- Shared server types

Important files include:

```text
src/core/server/
+-- detectServerEnvironment.ts
+-- normalizeServerInputs.ts
+-- serverCheck.ts
+-- serverValidation.ts
+-- types.ts
```

The exact internal structure may evolve, but the architectural ownership
remains the same.

---

## 3. Template Responsibilities

Reusable server state and reusable server-selection UI belong to Template.

Important Template areas include:

```text
src/template/state/server/
src/template/state/connectivity/
src/template/state/api/
src/template/screens/server/
```

Template responsibilities include:

- Configured server state
- Active server selection
- Server persistence
- Per-server UI status
- Connectivity state
- Server-selection UI
- Offline presentation
- Authentication-aware API integration
- Application-shell orchestration after a server switch

---

## 4. Application Responsibilities

Concrete applications may eventually provide application-specific server
configuration or restrictions.

Possible Application responsibilities include:

- Product-specific default servers
- Product-specific allowed server environments
- Product-specific server configuration
- Product-specific server-related feature rules

The Base Template must not depend on a concrete application's server
configuration.

---

## 5. Important Files

Current important files include:

```text
src/template/state/server/serverSlice.ts
src/template/state/server/serverStatusSlice.ts
src/template/state/connectivity/connectivitySlice.tsx
src/template/state/api/apiSlice.tsx

src/core/server/serverCheck.ts
src/core/server/serverValidation.ts
src/core/server/normalizeServerInputs.ts
src/core/server/detectServerEnvironment.ts
src/core/server/types.ts

src/template/components/layout/Footer.tsx
src/template/screens/server/
```

`apiSlice.tsx` remains transitional because it still combines several
responsibilities.

---

## 6. Shared Server Types

Shared technical server types belong to Core.

The canonical environment type is defined in:

```text
src/core/server/types.ts
```

Conceptually:

```ts
export type ServerEnvironment =
  | "DEV"
  | "TEST"
  | "PROD";
```

Template state may use this type, but Core code must not import the type from
Template.

A configured server conceptually contains information such as:

```ts
type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: ServerEnvironment;
};
```

The exact application state type may contain additional fields.

---

## 7. Server Persistence

Configured servers are persisted so that users do not need to re-enter their
server list on every application start.

Persistence is handled through the Template server state.

Conceptually:

```text
stored server configuration
        |
        v
initializeServers
        |
        v
Template server state
```

If no server configuration exists, the application may initialize a default
server.

For deployed web environments, the runtime origin may participate in
determining the initial backend location.

This behavior should remain centralized instead of being duplicated in
screens.

---

## 8. URL Normalization

Server URLs must be normalized through shared Core infrastructure.

The relevant implementation is located under:

```text
src/core/server/normalizeServerInputs.ts
```

Do not introduce additional local implementations such as:

```text
normalizeBaseUrl
normalizeServerUrl
fixServerUrl
```

unless they represent a genuinely different responsibility.

A single shared normalization implementation avoids inconsistent behavior
between:

- Login
- Server settings
- Server switching
- Connectivity checks
- API-client configuration

---

## 9. Reachability Check

Backend reachability is checked through:

```text
GET /api/alive
```

The purpose of this request is only to answer:

```text
Can the frontend reach the backend?
```

Reachability and authentication are separate concepts.

An HTTP response can prove that the backend is reachable even when the
response indicates:

- Authentication is required
- Access is denied
- A redirect is required
- A backend error occurred

Therefore:

```text
HTTP error != backend unreachable
Authentication failure != connectivity failure
OIDC redirect != connectivity failure
```

Connectivity checks must not perform logout.

---

## 10. Connectivity State

Reusable connectivity state belongs to Template.

The current state is located under:

```text
src/template/state/connectivity/connectivitySlice.tsx
```

Connectivity state represents whether the active backend is reachable.

Connectivity checks may be triggered by application-shell behavior such as:

- Initial application startup
- After login
- Periodic background checks
- Returning to an active browser state
- Server switching

The exact polling interval is an implementation detail and should not be
treated as an architectural contract.

---

## 11. Offline Presentation

The offline UI reads connectivity state and presents the current result.

The presentation layer does not own the technical reachability algorithm.

Conceptually:

```text
Core reachability check
        |
        v
Template connectivity state
        |
        v
Offline UI
```

The offline presentation must not decide authentication state.

---

## 12. Authentication Detection

Authentication and relevant backend settings are read through:

```text
GET /api/app/settings/get
```

The Core server infrastructure evaluates the response.

Relevant information may include:

```text
_AuthenticationMethod
_ServerWideSecurityConfiguration
_Authenticated
_session.*
_oidc.*
```

Authentication is normalized to the shared authentication type:

```text
jwt
oidc
unknown
```

The canonical authentication type belongs to:

```text
src/core/authentication/types.ts
```

---

## 13. Authentication and Connectivity Separation

Server switching depends on both connectivity and authentication, but they
must remain independent.

Conceptually:

```text
Reachability
    |
    +-- backend reachable
    |
    +-- backend unreachable

Authentication
    |
    +-- JWT
    |
    +-- OIDC
    |
    +-- unknown
```

A reachable server may still require authentication.

A valid authentication session may temporarily experience connectivity loss.

One state must not automatically overwrite the other.

---

## 14. Server Validation

Reusable server validation belongs to Core.

The relevant implementation is located at:

```text
src/core/server/serverValidation.ts
```

Validation may verify technical characteristics of a server before it becomes
active.

The validation mechanism must remain independent from concrete UI screens.

Screens should call reusable validation infrastructure instead of
implementing their own backend checks.

---

## 15. Server Environment Detection

Server environment detection belongs to Core.

The relevant implementation is located at:

```text
src/core/server/detectServerEnvironment.ts
```

Conceptually, a backend may be classified as:

```text
DEV
TEST
PROD
```

The environment type belongs to Core because it is shared technical
information.

Template may use the detected environment for presentation and behavior.

---

## 16. Saved Server State

Configured server state belongs to:

```text
src/template/state/server/serverSlice.ts
```

Responsibilities include areas such as:

- Configured server list
- Active server
- Active environment
- Initialization
- Persistence
- Server selection

The exact state shape may evolve during the architecture migration.

---

## 17. Server Status Metadata

Presentation-oriented status metadata belongs to Template.

The relevant state is located under:

```text
src/template/state/server/serverStatusSlice.ts
```

Conceptually, status metadata may include information such as:

```ts
type ServerStatusMeta = {
  tone: "green" | "yellow" | "red";
  subtitle: string;
};
```

This is UI-oriented state.

It does not belong in Core server validation.

---

## 18. API State

The active API configuration currently participates in:

```text
src/template/state/api/apiSlice.tsx
```

This module currently handles several concerns such as:

- Active server URL
- Authentication state
- Generated API clients
- JWT persistence
- Server switching
- Runtime API configuration
- Template orchestration

This makes `apiSlice.tsx` a transitional module.

It must not be moved unchanged into Core.

---

## 19. Server Switching Flow

Conceptually, server switching follows this flow:

```text
User selects server
        |
        v
Normalize server URL
        |
        v
Load server-specific authentication state
        |
        v
Check backend reachability
        |
        v
Read backend settings
        |
        v
Detect authentication method
        |
        v
Rebuild API clients
        |
        v
Update active server/authentication state
        |
        v
Run required Template orchestration
```

The exact implementation may contain additional steps.

The architectural responsibility of each step must remain clear.

---

## 20. JWT Server Switching

JWT authentication state is stored per normalized server.

Conceptually:

```text
server A --> JWT A
server B --> JWT B
server C --> no JWT
```

Switching from one JWT server to another should restore the JWT belonging to
the selected server when available.

A JWT belonging to one server must not be reused for another server.

---

## 21. OIDC Server Switching

OIDC authentication is based primarily on the browser session of the selected
backend.

When switching to an OIDC server:

```text
selected authentication method = OIDC
```

A stored frontend JWT must not become the active authentication mechanism for
that server.

OIDC authentication and JWT authentication must remain explicitly separated.

---

## 22. API Client Rebuild

Generated API clients must represent the currently selected server and its
authentication mechanism.

For JWT:

```text
Authorization: Bearer <jwt>
```

For OIDC:

```text
withCredentials: true
```

When the server changes, API clients must be rebuilt with the new base URL and
correct authentication configuration.

---

## 23. Menu and Application-Shell Orchestration

Some server switching behavior may trigger Template application-shell work
after the technical switch succeeds.

Examples may include:

- Menu reload
- Feature visibility recalculation
- Session initialization
- Notification context changes
- Update checks

These actions belong to Template orchestration.

They must not be moved into Core server utilities.

This separation is important because Core must not know about Template
navigation or UI state.

---

## 24. Footer Integration

The Template footer may expose server-related UI such as:

- Active server information
- Server switching
- Connectivity information
- Notifications
- Release information

The footer is a consumer of server state.

It does not own server validation or connectivity algorithms.

---

## 25. Server Screens

Reusable server-management screens live under:

```text
src/template/screens/server/
```

These screens may provide:

- Server configuration
- Server selection
- Server status
- Offline information

They belong to Template because they are reusable UI.

Technical server validation remains in Core.

---

## 26. Initialization

Server initialization happens early in application startup.

This is important because other Template systems may depend on active server
information.

Conceptually:

```text
initialize servers
        |
        v
initialize API/authentication
        |
        v
initialize dependent Template state
```

The exact initialization sequence is documented separately in the state and
application-shell documentation.

Do not reorder server initialization without checking dependent state.

---

## 27. Transitional apiSlice Responsibilities

`src/template/state/api/apiSlice.tsx` currently combines multiple
responsibilities.

These include:

```text
server selection
authentication state
API-client construction
JWT persistence
runtime configuration
Template orchestration
```

A future refactor should separate these responsibilities incrementally.

Do not perform a large rewrite simply to move the file.

The correct sequence is to extract one clear responsibility at a time while
preserving runtime behavior.

---

## 28. Core Boundary

Core server infrastructure may contain:

```text
URL normalization
server validation
environment detection
reachability checks
backend settings parsing
shared technical types
```

Core server infrastructure must not contain:

```text
Template menu reload
Template Redux orchestration
React UI
application-specific screens
application-specific configuration
```

This boundary must remain enforceable.

---

## 29. Import Policy

Prefer stable architectural imports.

Examples:

```ts
import type {
  ServerEnvironment,
} from "@/core/server/types";
```

Do not duplicate technical server types inside Template.

Do not perform broad automated replacement of server-related imports across
the entire repository.

Before moving server code:

```text
search
inspect
move
update imports
search again
test
```

---

## 30. Validation Workflow

After server-related changes, search affected references.

Examples:

```bash
git grep -n "serverSlice" -- src test
git grep -n "serverStatusSlice" -- src test
git grep -n "connectivitySlice" -- src test
git grep -n "serverCheck" -- src test
git grep -n "normalizeServerInputs" -- src test
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run targeted Jest tests for affected modules.

For example:

```bash
npx jest --runTestsByPath test/connectivitySlice.test.ts
```

Validate the patch:

```bash
git diff --check
```

When runtime behavior changes, start the application through:

```bash
npm start
```

For a cleared cache while preserving npm lifecycle hooks:

```bash
npm start -- --clear
```

Do not use direct `npx expo start` as the normal startup path when application
configuration may have changed.

---

## 31. Current Status

### Implemented

- Server state under Template ownership
- Connectivity state under Template ownership
- Shared Core server types
- Shared URL normalization
- Server reachability checks
- Server validation
- Environment detection
- Authentication-method detection
- Multiple configured servers
- Runtime server switching
- Authentication-aware API-client rebuilding
- Server-specific JWT handling
- Separation between connectivity and authentication concepts

### Transitional

- `apiSlice.tsx` still combines several responsibilities.
- Server switching still participates in Template orchestration through the API
  state.
- Some concrete server behavior may still be product-specific.
- Final public server extension APIs are not yet complete.
- Concrete application server configuration is not yet fully externalized.

### Planned

- Further separate `apiSlice` responsibilities.
- Define stable public Core server APIs.
- Define supported Application server configuration where required.
- Remove remaining mixed responsibility from server switching.
- Maintain automated dependency-boundary validation.
- Keep Core independent from Template navigation and Redux composition.

---

## 32. Architecture Rules

Server-related changes must preserve these rules:

1. Core must not import Template or Application.
2. Connectivity must not perform logout.
3. Authentication failure must not automatically mean offline.
4. OIDC redirect behavior must not be treated as connectivity failure.
5. Server URL normalization must remain centralized.
6. JWT state must remain server-specific.
7. API clients must be rebuilt for the selected server.
8. Template UI must not duplicate Core validation logic.
9. Template orchestration must not be moved into Core.
10. Product-specific server configuration belongs to Application.

---

## 33. Next Steps

Server architecture work should continue incrementally.

Recommended next areas are:

- Separate remaining server responsibilities inside `apiSlice`.
- Review API-client construction independently from server state.
- Review authentication state independently from connectivity state.
- Keep normalization centralized.
- Define a stable public Core server API.
- Review which server defaults belong to Application.
- Keep Template server UI reusable.
- Add or maintain dependency-boundary checks.

Do not move modules solely to achieve a cleaner folder structure.

Move them only when their responsibility and dependencies match the target
architecture.

---

## 34. Success Criteria

Server separation is complete when:

1. Core owns reusable technical server capabilities only.
2. Template owns reusable server UI and state.
3. Application owns concrete product server configuration.
4. Core has no Template dependencies.
5. Connectivity and authentication remain independent.
6. Server switching rebuilds API clients correctly.
7. JWT state is preserved per server.
8. OIDC uses browser-session authentication correctly.
9. URL normalization has one canonical implementation.
10. Server validation is reusable outside individual screens.
11. Template orchestration does not leak into Core server utilities.
12. A separate application repository can use the Base Template server
    infrastructure without modifying internal Template code.