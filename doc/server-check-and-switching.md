# Server Check and Server Switching

## Purpose

This document describes the server architecture of `web.template`, including:

* server configuration
* URL normalization
* backend reachability
* connectivity state
* server validation
* authentication detection
* server environment detection
* runtime server switching
* API-client rebuilding
* architectural ownership
* current technical decomposition areas

The Template supports multiple compatible Agent.Workbench backend servers and can switch between them at runtime.

The architecture follows:

```text
Application --> Template --> Core
```

Standard Agent.Workbench server behavior belongs to the reusable Base Template.

Concrete Applications such as HEMS may provide additional product-specific server configuration when genuinely required.

---

# 1. Architecture

Conceptually:

```text
Application-specific server configuration
                |
                v
Template server UI, state and orchestration
                |
                v
Core server validation and technical capability
                |
                v
Backend endpoints
```

General ownership:

```text
Technical server capability
    -> Core

Reusable server UI/state/orchestration
    -> Template

Concrete product-specific server configuration
    -> Application
```

Core must not import Template or Application.

Template must not import concrete Application implementation.

---

# 2. Agent.Workbench Server Ownership

Standard Agent.Workbench server behavior is intentionally Template-owned.

This includes reusable behavior such as:

```text
configured server management
active server selection
server-selection UI
connectivity presentation
authentication-aware switching
API-client rebuilding
server persistence
standard server settings
```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Therefore these responsibilities are not waiting to move into a separate Agent.Workbench Application repository.

Technical server primitives remain Core-owned where appropriate.

---

# 3. Core Responsibilities

Reusable technical server logic belongs to Core when it does not depend on:

```text
Template UI
Template Redux state
navigation
concrete Application behavior
```

Core responsibilities include:

* server URL normalization
* server reachability checks
* technical server validation
* authentication-method detection support
* backend settings parsing
* server environment detection
* shared technical server types

Important files include:

```text
src/core/server/
+-- detectServerEnvironment.ts
+-- normalizeServerInputs.ts
+-- serverCheck.ts
+-- serverValidation.ts
+-- types.ts
```

The internal structure may evolve.

The ownership boundary must remain stable.

---

# 4. Template Responsibilities

Reusable server state and server-selection behavior belong to Template.

Important Template areas include:

```text
src/template/state/server/
src/template/state/connectivity/
src/template/state/api/
src/template/screens/server/
```

Template responsibilities include:

* configured server state
* active server selection
* server persistence
* server status metadata
* connectivity state
* server-selection UI
* offline presentation
* authentication-aware API integration
* API-client rebuilding
* application-platform orchestration after server switching

These responsibilities remain Template-owned even when they are primarily used with Agent.Workbench backends.

---

# 5. Application Responsibilities

Concrete Applications may provide additional server configuration when the requirement is genuinely product-specific.

Examples may include:

```text
HEMS-specific default backend
HEMS-only server restrictions
consumer-specific environment restrictions
consumer-specific server metadata
consumer-specific server feature rules
```

The Base Template must not import concrete Application server implementation.

Application-specific configuration extends the reusable server platform.

It does not replace standard Template server functionality.

---

# 6. Important Files

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

`apiSlice.tsx` still combines several technical and Template orchestration responsibilities.

This is a technical decomposition concern.

It does not make the module concrete Application state.

---

# 7. Shared Server Types

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

Template may consume this type.

Core must not import an equivalent type from Template.

A configured server may conceptually contain:

```ts
type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: ServerEnvironment;
};
```

The actual Template state may contain additional fields.

---

# 8. Server Persistence

Configured servers are persisted so users do not need to recreate their server list on every start.

Persistence belongs to Template server state.

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

When no persisted configuration exists, Template may establish an initial server according to the supported runtime/configuration rules.

For deployed web environments, runtime origin may participate in determining the initial backend location.

Initialization must remain centralized.

Screens must not independently implement server initialization.

---

# 9. URL Normalization

Server URLs must use the shared Core normalization implementation.

Relevant file:

```text
src/core/server/normalizeServerInputs.ts
```

Do not create parallel helpers such as:

```text
normalizeBaseUrl
normalizeServerUrl
fixServerUrl
```

unless they represent a genuinely different responsibility.

Centralized normalization avoids inconsistent behavior between:

```text
Login
Server settings
Server switching
Connectivity checks
API-client configuration
```

---

# 10. Reachability Check

Backend reachability is checked through:

```text
GET /api/alive
```

The technical question is:

```text
Can the frontend reach the backend?
```

Reachability is not authentication.

An HTTP response may demonstrate that a backend is reachable even when:

```text
authentication is required
access is denied
a redirect is required
a backend error is returned
```

Therefore:

```text
HTTP error != backend unreachable

Authentication failure != connectivity failure

OIDC redirect != connectivity failure
```

Connectivity checks must not trigger logout.

---

# 11. Connectivity State

Reusable connectivity state belongs to Template.

Current location:

```text
src/template/state/connectivity/connectivitySlice.tsx
```

Connectivity state represents whether the active backend is reachable.

Checks may occur during:

* initial application startup
* after login
* periodic runtime checks
* returning to an active browser state
* server switching

Polling intervals and retry timing are implementation details rather than architectural contracts.

---

# 12. Offline Presentation

Offline UI consumes Template connectivity state.

Conceptually:

```text
Core reachability result
        |
        v
Template connectivity state
        |
        v
Offline presentation
```

The UI does not own the technical reachability algorithm.

Offline presentation must not independently modify authentication state.

---

# 13. Authentication Detection

Authentication information and relevant backend settings are read through:

```text
GET /api/app/settings/get
```

Core server infrastructure evaluates technical response information.

Relevant settings may include:

```text
_AuthenticationMethod
_ServerWideSecurityConfiguration
_Authenticated
_session.*
_oidc.*
```

Authentication is normalized to:

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

# 14. Authentication and Connectivity

Connectivity and authentication must remain separate.

Conceptually:

```text
Connectivity
|
+-- reachable
|
+-- unreachable

Authentication
|
+-- JWT
|
+-- OIDC
|
+-- unknown
```

A reachable backend may still require authentication.

A valid authenticated session may temporarily experience network loss.

One state must not automatically overwrite the other.

---

# 15. Server Validation

Reusable technical server validation belongs to Core.

Relevant implementation:

```text
src/core/server/serverValidation.ts
```

Validation may verify technical characteristics before a server becomes active.

Validation must remain independent from concrete React screens.

Screens should consume reusable validation behavior rather than implement duplicate backend checks.

---

# 16. Server Environment Detection

Environment detection belongs to Core.

Relevant implementation:

```text
src/core/server/detectServerEnvironment.ts
```

A backend may conceptually be classified as:

```text
DEV
TEST
PROD
```

The environment value is reusable technical information.

Template may consume it for presentation and runtime behavior.

---

# 17. Saved Server State

Configured server state belongs to:

```text
src/template/state/server/serverSlice.ts
```

Responsibilities may include:

```text
configured server list
active server
active environment
initialization
persistence
server selection
```

The exact Redux state shape may evolve.

The ownership remains Template.

---

# 18. Server Status Metadata

Presentation-oriented server metadata belongs to Template.

Relevant state:

```text
src/template/state/server/serverStatusSlice.ts
```

Conceptually:

```ts
type ServerStatusMeta = {
  tone: "green" | "yellow" | "red";
  subtitle: string;
};
```

This is presentation-oriented state.

It does not belong in Core server validation.

---

# 19. API State

Active API configuration currently participates in:

```text
src/template/state/api/apiSlice.tsx
```

The module coordinates multiple concerns, including:

```text
active server URL
authentication state
generated API clients
JWT persistence
server switching
runtime API configuration
Template orchestration
```

This remains a broad responsibility set.

Further technical decomposition may be appropriate.

The module must not be moved unchanged into Core.

It also must not be classified as concrete Agent.Workbench Application state.

---

# 20. Server Switching Flow

Conceptually:

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

The implementation may contain additional technical steps.

Architectural ownership must remain explicit throughout the flow.

---

# 21. JWT Server Switching

JWT authentication state is stored per normalized server.

Conceptually:

```text
server A -> JWT A
server B -> JWT B
server C -> no JWT
```

When switching between JWT servers, Template may restore the JWT associated with the selected server.

A JWT belonging to one backend must never be reused for another backend.

---

# 22. OIDC Server Switching

OIDC authentication is primarily based on the browser session of the selected backend.

When switching to an OIDC backend:

```text
active authentication method = OIDC
```

Stored frontend JWT state must not become the active authentication mechanism.

JWT and OIDC flows must remain explicitly separated.

---

# 23. API Client Rebuild

Generated API clients must represent:

```text
selected server
authentication method
authentication credentials
```

For JWT:

```text
Authorization: Bearer <jwt>
```

For OIDC:

```text
withCredentials: true
```

When the server changes, API clients must be rebuilt with:

```text
new base URL
correct authentication mechanism
correct credentials behavior
```

---

# 24. Template Orchestration

A successful server switch may require additional Template work.

Examples may include:

```text
navigation/menu refresh
feature visibility recalculation
session initialization
notification-context changes
update checks
```

These are Template orchestration responsibilities.

Core server utilities must not know about:

```text
Template navigation
Template Redux orchestration
Template UI
```

---

# 25. Feature Visibility

Server changes may affect the availability or visibility of Template functionality.

Application-facing feature selection remains semantic through:

```text
src/application/config/features.properties
```

Template owns the actual reusable feature implementation and runtime visibility logic.

Server infrastructure must not require Application to know Template-internal navigation IDs.

---

# 26. Footer Integration

The Template footer may expose:

```text
active server
server switching
connectivity status
notifications
release information
```

The footer consumes server state.

It does not own:

```text
URL normalization
server validation
connectivity algorithms
authentication detection
```

---

# 27. Server Screens

Reusable server-management screens live under:

```text
src/template/screens/server/
```

They may provide:

```text
server configuration
server selection
server status
offline information
```

These screens belong to Template.

They are standard reusable Base Template functionality.

Their use with Agent.Workbench backends does not make them Application-owned.

---

# 28. Initialization

Server initialization occurs early during application startup.

Conceptually:

```text
initialize server state
        |
        v
initialize API/authentication
        |
        v
initialize dependent Template behavior
```

Other Template systems may depend on active server information.

Do not change initialization order without verifying dependent state and runtime behavior.

---

# 29. Technical Decomposition of apiSlice

`src/template/state/api/apiSlice.tsx` currently combines several responsibilities:

```text
server selection
authentication state
API-client construction
JWT persistence
runtime configuration
Template orchestration
```

These responsibilities may be separated incrementally.

This work should:

```text
identify one responsibility
define its owner
remove unnecessary coupling
extract safely
update imports
test behavior
```

Do not perform a large rewrite simply to produce a cleaner directory structure.

---

# 30. Technical Decomposition Is Not Application Extraction

Further decomposition of `apiSlice.tsx` does not imply:

```text
apiSlice belongs to Application

server switching belongs to Application

standard server settings should leave Template

Agent.Workbench server state should move to another repository

Agent.Workbench server UI is transitional Application code
```

The purpose is technical responsibility separation within the accepted architecture.

---

# 31. Core Boundary

Core server infrastructure may contain:

```text
URL normalization
server validation
environment detection
reachability checks
backend settings parsing
shared technical server types
```

Core server infrastructure must not contain:

```text
Template navigation reload
Template Redux orchestration
React UI
Application screens
concrete product configuration
```

The boundary must remain enforceable.

---

# 32. Application Configuration

Developer-facing Application configuration uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Server-specific Application configuration should only be introduced when a concrete consumer requires it.

For example, future HEMS requirements may justify additional consumer-specific server configuration.

Do not add speculative Application configuration solely to mirror standard Agent.Workbench behavior.

---

# 33. HEMS Consumer Example

A concrete HEMS Application may consume the reusable server platform:

```text
HEMS Application
        |
        v
Template server UI/state/orchestration
        |
        v
Core technical server capability
```

HEMS may add product-specific constraints where required.

Template must not import HEMS implementation.

Core must remain unaware of HEMS.

---

# 34. Import Policy

Prefer stable architecture-aligned imports.

Example:

```ts
import type {
  ServerEnvironment,
} from "@/core/server/types";
```

Do not duplicate technical Core server types in Template.

Do not perform broad automated replacements of server-related imports.

Before moving code:

```text
search
inspect
identify owner
move
update imports
search again
test
```

---

# 35. Current Status

## Implemented

Current server architecture includes:

```text
Template-owned configured server state
Template-owned connectivity state
Template-owned server UI
Core server types
shared URL normalization
server reachability checks
server validation
environment detection
authentication-method detection
multiple configured servers
runtime server switching
authentication-aware API-client rebuilding
server-specific JWT handling
connectivity/authentication separation
```

## Technical Decomposition Area

`apiSlice.tsx` still combines several responsibilities.

Some server-switching behavior also remains coordinated through this broad API state module.

This is technical decomposition work.

It is not an architectural migration of Agent.Workbench functionality into Application.

## Future Consumer Work

Future work may include:

```text
stable public server integration APIs
consumer-specific configuration where real requirements exist
HEMS validation
additional dependency-boundary checks
```

---

# 36. Architecture Rules

Server-related changes must preserve these rules:

1. Core must not import Template or Application.
2. Template must not import concrete Application implementation.
3. Standard Agent.Workbench server behavior belongs to Template.
4. Technical server capability belongs to Core.
5. Concrete product-only server configuration belongs to Application.
6. Connectivity must not perform logout.
7. Authentication failure must not automatically mean offline.
8. OIDC redirects must not be treated as connectivity failures.
9. Server URL normalization must remain centralized.
10. JWT state must remain server-specific.
11. API clients must be rebuilt for the selected backend.
12. Template UI must not duplicate Core validation logic.
13. Template orchestration must not move into Core.
14. Application must not depend on Template-internal navigation IDs.
15. Technical decomposition must not be confused with Application extraction.

---

# 37. Validation

After server-related implementation changes, useful searches include:

```bash
git grep -n "serverSlice" -- src test
git grep -n "serverStatusSlice" -- src test
git grep -n "connectivitySlice" -- src test
git grep -n "serverCheck" -- src test
git grep -n "normalizeServerInputs" -- src test
```

Validate architecture boundaries:

```bash
git grep -n "@/application/" -- src/template
git grep -n "@/template/" -- src/application
```

Run:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

When runtime server behavior changes:

```bash
npm start
```

For a cleared cache while preserving npm lifecycle behavior:

```bash
npm start -- --clear
```

---

# 38. Future Technical Work

Potential server work includes:

* separate clearly identifiable responsibilities inside `apiSlice`
* review API-client construction independently from server state
* keep authentication state separate from connectivity state
* maintain one canonical URL normalization implementation
* define stable Core technical server contracts where useful
* define consumer server configuration only when real Application requirements exist
* keep Template server UI reusable
* validate a concrete consumer such as HEMS
* maintain architecture-boundary checks

Do not move modules merely to improve folder appearance.

Responsibility and dependency direction determine ownership.

---

# 39. Incorrect Legacy Interpretation

The following statements do not describe the accepted architecture:

```text
"Agent.Workbench server functionality should move into Application."

"Agent.Workbench server UI inside Template is transitional."

"apiSlice is waiting for Agent.Workbench Application extraction."

"Server switching belongs to a separate Agent.Workbench repository."

"Concrete Application server configuration must replace Template server state."

"All Agent.Workbench-specific server behavior is concrete product code."
```

The correct ownership is:

```text
technical reusable server capability
    -> Core

standard reusable server platform
    -> Template

concrete consumer-only server behavior
    -> Application
```

---

# 40. Success Criteria

The server architecture is correct when:

1. Core owns reusable technical server capability only.
2. Template owns reusable server state, UI and orchestration.
3. Standard Agent.Workbench server behavior remains Template-owned.
4. Concrete product-only server behavior remains Application-owned.
5. Core has no Template dependencies.
6. Template has no concrete Application dependencies.
7. Connectivity and authentication remain independent.
8. Server switching rebuilds API clients correctly.
9. JWT state remains server-specific.
10. OIDC uses browser-session authentication correctly.
11. URL normalization has one canonical implementation.
12. Server validation remains reusable outside individual screens.
13. Template orchestration does not leak into Core server utilities.
14. Technical decomposition of `apiSlice` does not become Application extraction.
15. A concrete consumer such as HEMS can use the server platform through supported Base Template contracts.

---

# 41. Summary

Server functionality follows:

```text
Application --> Template --> Core
```

Core owns technical server capabilities such as:

```text
normalization
validation
reachability
environment detection
technical backend parsing
```

Template owns reusable server behavior such as:

```text
server state
connectivity state
server-selection UI
server persistence
authentication-aware switching
API-client rebuilding
standard Agent.Workbench server behavior
```

Application owns only concrete consumer-specific server behavior where required.

`apiSlice.tsx` may still benefit from technical decomposition, but that does not make it transitional Application code and does not require a separate Agent.Workbench Application repository.
