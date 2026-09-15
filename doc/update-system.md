# Update System

## Purpose

This document describes the frontend and backend update architecture of `web.template`, including:

* update checks
* update state
* update notifications
* update watchers
* user interaction
* frontend reload behavior
* backend restart handling
* architectural ownership
* current technical decomposition areas

The architecture follows:

```text
Application --> Template --> Core
```

Standard Agent.Workbench update behavior belongs to the reusable Base Template.

Concrete Applications such as HEMS may provide additional product-specific update behavior only when genuinely required.

---

# 1. Update Responsibilities

The update system supports:

```text
Frontend WebApp updates
Backend server updates
```

Current behavior includes:

* loading update configuration
* checking for frontend updates
* checking for backend updates
* publishing update notifications
* displaying update information
* starting explicitly requested updates
* tracking update progress
* tracking update errors
* reloading the WebApp after a frontend update
* handling backend restart/reconnect behavior

The system must distinguish:

```text
checking for updates
```

from:

```text
installing updates
```

Unless explicitly implemented and documented:

```text
automatic check != automatic installation
```

---

# 2. Architectural Ownership

Update ownership follows responsibility.

```text
Application
|
+-- concrete consumer-specific update behavior
    where genuinely required

Template
|
+-- update Redux state
+-- update hooks
+-- update watchers
+-- update UI
+-- notifications
+-- application-platform orchestration
+-- standard Agent.Workbench update behavior

Core
|
+-- focused technical update capabilities
```

Template may depend on Core.

Core must not depend on Template or Application.

---

# 3. Agent.Workbench Update Ownership

Standard Agent.Workbench update functionality is intentionally Template-owned.

This includes reusable behavior such as:

```text
frontend update checks
backend update checks
update Redux state
update notifications
update dialogs
update watchers
update progress
post-login update handling
backend restart coordination
```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Therefore standard Agent.Workbench update functionality is not waiting to move into another repository.

---

# 4. Responsibility Rule

Update functionality does not belong in Core merely because it is technical.

A module belongs to Core only when it can remain independent from:

```text
Redux
Template UI
Template application lifecycle
notifications
navigation
concrete Application implementation
```

The ownership rule is:

```text
Pure technical update capability
    -> Core

Reusable update state/UI/orchestration
    -> Template

Concrete consumer-only update behavior
    -> Application
```

---

# 5. Current Structure

Important update areas include:

```text
src/template/state/update/
src/template/hooks/update/
src/template/update/watchers/
src/core/update/
```

Conceptually:

```text
src/
+-- core/
|   +-- update/
|       +-- reloadUpdatedFrontendWebApp.ts
|
+-- template/
    +-- hooks/
    |   +-- update/
    |
    +-- state/
    |   +-- update/
    |
    +-- update/
        +-- watchers/
```

The internal structure may evolve.

Architectural ownership must remain consistent.

---

# 6. Update Redux State

Reusable update state belongs to Template.

Current location:

```text
src/template/state/update/
```

Update state may contain information such as:

* update configuration
* frontend update availability
* backend update availability
* current frontend version
* available frontend version
* current backend version
* available backend version
* update progress
* update status
* update errors
* active update operation

Redux is a state-management technology.

It does not make state Core-owned.

---

# 7. Why Update Redux State Is Not Core

Core must remain independent from the Template Redux store.

The following is not the architecture:

```text
Core
|
+-- Redux update slice
+-- notification state
+-- update UI
```

The correct separation is:

```text
Template
|
+-- update Redux state
+-- update orchestration
+-- update UI
+-- notifications

Core
|
+-- focused technical helper
```

---

# 8. Update Hooks

Reusable update hooks belong to Template when they coordinate:

```text
React lifecycle
Template state
authentication lifecycle
application-platform behavior
```

Current location:

```text
src/template/hooks/update/
```

Known hooks include:

```text
useFrontendVersionReloadWeb.ts
usePostLoginAutoReloadWeb.ts
```

These are Template hooks.

They are not Core infrastructure.

---

# 9. Update Watchers

Runtime update watchers belong to Template.

Current location:

```text
src/template/update/watchers/
```

Known watchers include:

```text
PostLoginUpdateWatcher.tsx
UpdateNotificationWatcher.tsx
```

They may:

* observe update Redux state
* trigger update checks
* publish notifications
* coordinate update behavior after login
* integrate updates with the application lifecycle

They are application-platform orchestration and therefore Template-owned.

---

# 10. PostLoginUpdateWatcher

`PostLoginUpdateWatcher` coordinates update behavior after successful authentication.

Conceptually:

```text
Login completed
        |
        v
PostLoginUpdateWatcher
        |
        v
inspect update state
        |
        v
run required Template update behavior
```

Core must not know when a user has logged into the Template application.

Therefore this watcher belongs to Template.

---

# 11. UpdateNotificationWatcher

`UpdateNotificationWatcher` connects update state with reusable notification infrastructure.

Conceptually:

```text
Update state changes
        |
        v
UpdateNotificationWatcher
        |
        v
Template notification state
        |
        v
Notification UI
```

The update state should not contain presentation logic.

The notification system should not own update business logic.

---

# 12. Notifications

Update notifications use the reusable Template notification infrastructure.

Notification state belongs under:

```text
src/template/state/notifications/
```

Update notifications may be created when:

* a frontend update becomes available
* a backend update becomes available
* an update succeeds
* an update fails

Presentation remains separate from technical update communication.

---

# 13. Frontend Update Flow

Conceptually:

```text
Check frontend version
        |
        v
Detect newer version
        |
        v
Store update state
        |
        v
Notify user
        |
        v
User starts update
        |
        v
Frontend update completes
        |
        v
Reload WebApp
```

The Template coordinates the workflow.

The technical browser reload mechanism belongs to Core.

---

# 14. Frontend Reload Helper

The technical reload helper is located at:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

Its responsibility is focused:

```text
reload updated frontend WebApp
```

Conceptually:

```text
Template determines reload is required
        |
        v
Core reload helper
        |
        v
Browser reload
```

Core provides the mechanism.

Template decides when it is used.

---

# 15. Frontend Version Monitoring

Frontend version monitoring belongs to Template update infrastructure.

Known hook:

```text
src/template/hooks/update/useFrontendVersionReloadWeb.ts
```

The hook may consume:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

for the actual technical reload.

This preserves:

```text
Template --> Core
```

---

# 16. Post-Login Reload Handling

Post-login update/reload behavior is coordinated through Template infrastructure.

Known hook:

```text
src/template/hooks/update/usePostLoginAutoReloadWeb.ts
```

Related watcher:

```text
src/template/update/watchers/PostLoginUpdateWatcher.tsx
```

The responsibilities between hook and watcher should remain explicit.

Neither should duplicate the Core reload implementation.

---

# 17. Backend Update Flow

Backend updates differ from frontend updates because the backend may restart.

Conceptually:

```text
Check backend version
        |
        v
Detect available update
        |
        v
Store update state
        |
        v
Notify user
        |
        v
User starts update
        |
        v
Backend restarts
        |
        v
Temporary connectivity loss
        |
        v
Backend becomes reachable
        |
        v
Authentication/session state is reevaluated
```

Backend update orchestration must reuse existing server and authentication infrastructure.

---

# 18. Connectivity During Backend Update

A backend update may temporarily make the backend unreachable.

This does not automatically mean:

```text
user logged out
```

The architecture rule remains:

```text
Connectivity failure != authentication failure
```

Connectivity state belongs to:

```text
src/template/state/connectivity/
```

Technical server checks belong to:

```text
src/core/server/
```

The update system must not implement a second connectivity subsystem.

---

# 19. Authentication After Backend Update

After backend restart, authentication may need to be reevaluated.

Possible outcomes include:

```text
JWT session remains usable
JWT session becomes invalid
OIDC browser session remains valid
OIDC browser session expires
```

The update system must reuse existing authentication/session infrastructure.

It must not implement duplicate:

```text
login logic
logout logic
JWT management
OIDC session management
```

---

# 20. Automatic Update Checks

Update strategy may allow automatic checks.

Conceptually:

```text
automatic checking enabled
        |
        v
periodic/update-triggered check
```

Automatic checking must remain separate from update installation.

Unless explicitly configured otherwise:

```text
automatic check
    !=
automatic installation
```

---

# 21. Manual Installation

Reusable Template UI may allow a user to explicitly start an update.

Template owns:

* update information presentation
* confirmation
* install action handling
* progress presentation
* error presentation
* completion presentation

Technical communication and state mutation should remain outside purely presentational components.

---

# 22. Update UI

Reusable update screens and dialogs belong to Template.

They may present:

```text
frontend update information
backend update information
update strategy information
check actions
install actions
confirmation dialogs
progress
errors
completion state
```

The UI consumes update state.

It must not become the primary owner of technical update APIs.

---

# 23. Separation of Responsibilities

The intended relationship is:

```text
Template update UI
        |
        v
Template update state/orchestration
        |
        v
technical APIs/helpers
```

Frontend reload:

```text
Template orchestration
        |
        v
Core reload helper
```

Backend communication:

```text
Template update orchestration
        |
        v
existing API/server infrastructure
```

---

# 24. Standard Base Template Responsibility

The Base Template owns reusable update capabilities including:

```text
update state
update UI
update checks
update watchers
notifications
update orchestration
standard Agent.Workbench update behavior
```

This functionality does not become Application-owned simply because the current backend is an Agent.Workbench backend.

---

# 25. Application Responsibility

Concrete Applications own update behavior only when it is genuinely consumer-specific.

Possible examples include:

```text
HEMS-only release channel
HEMS-specific update policy
consumer-specific backend update restriction
consumer-specific update visibility
consumer-specific deployment/update metadata
```

Template must not import this concrete Application implementation.

---

# 26. Application Configuration

Developer-facing Application configuration currently uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

If a future concrete consumer requires additional update configuration, it should be introduced through a supported Application contract.

Do not introduce speculative Application update configuration solely to relocate standard Agent.Workbench behavior.

---

# 27. Core Boundary

Current known Core update functionality includes:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

Core update code must not depend on:

* Redux store composition
* Template notifications
* Template screens
* Template navigation
* concrete Application configuration
* Template update state
* concrete consumer behavior

If a module requires those dependencies, it belongs above Core.

---

# 28. Redux Relationship

Update Redux state belongs to Template.

Conceptually:

```text
templateReducers
        |
        +-- update
```

The extensible Redux architecture does not require this reducer to move into Application.

Standard Agent.Workbench update state also remains Template-owned.

Only genuine concrete product-specific state belongs to Application.

---

# 29. Notification Relationship

Updates and notifications remain separate responsibilities.

Conceptually:

```text
Update state
        |
        v
UpdateNotificationWatcher
        |
        v
Notification state
        |
        v
Notification UI
```

Update state should not own notification presentation.

Notification infrastructure should remain reusable.

---

# 30. Server Relationship

Backend updates depend on server infrastructure.

Ownership remains:

```text
Core
|
+-- technical server checks

Template
|
+-- server/connectivity state
+-- update orchestration
```

Update logic should reuse server infrastructure rather than create local duplicate server checks.

---

# 31. Authentication Relationship

Backend restart may affect authentication.

Ownership remains:

```text
Core
|
+-- technical authentication capability

Template
|
+-- authentication/session orchestration
+-- update orchestration
```

The update system may trigger or participate in reevaluation.

It must not duplicate the authentication implementation.

---

# 32. Technical Decomposition Areas

The overall update ownership is established.

Some technical responsibilities may still be coupled to broad API/runtime state.

For example:

```text
update API communication
broad API state
backend restart coordination
server reconnect behavior
```

These may be reviewed incrementally.

This is technical decomposition.

It is not Agent.Workbench Application extraction.

---

# 33. Agent.Workbench-Specific Backend Terminology

Some backend update behavior may contain Agent.Workbench terminology or depend on Agent.Workbench-compatible backend APIs.

That alone does not make the behavior Application-owned.

The ownership question is:

```text
Is this standard functionality of the reusable Base Template?
```

If yes:

```text
Template
```

If it exists only for a concrete consumer such as HEMS:

```text
Application
```

Naming alone does not determine ownership.

---

# 34. HEMS Consumer Example

A concrete HEMS Application may consume the reusable update platform.

Conceptually:

```text
HEMS Application
        |
        v
Template update platform
        |
        v
Core update capabilities
```

HEMS may add product-specific update configuration where genuinely required.

Template must not import HEMS implementation.

Core must remain independent from HEMS.

---

# 35. Historical Refactoring

The update architecture has already been reorganized incrementally.

Relevant completed structural work includes:

```text
Update Redux state
    -> src/template/state/update/

Update hooks
    -> src/template/hooks/update/

Runtime watchers
    -> src/template/update/watchers/

Browser reload helper
    -> src/core/update/reloadUpdatedFrontendWebApp.ts
```

This history explains the current structure.

It does not imply an unfinished migration of standard Agent.Workbench update functionality into Application.

---

# 36. Safe Refactoring

Update refactoring should remain incremental.

Preferred process:

```text
Identify responsibility
        |
        v
Search all usages
        |
        v
Determine architectural owner
        |
        v
Extract one coherent responsibility
        |
        v
Update imports
        |
        v
Run TypeScript validation
        |
        v
Run targeted tests
        |
        v
Validate runtime behavior
```

Do not move the complete update subsystem merely to improve folder appearance.

---

# 37. Import Policy

Template update modules may import Core helpers.

Example:

```ts
import {
  reloadUpdatedFrontendWebApp,
} from "@/core/update/reloadUpdatedFrontendWebApp";
```

Core update modules must not import from:

```text
@/template
@/application
```

Avoid broad automated import rewrites.

Search and inspect exact dependencies before moving functionality.

---

# 38. Current Status

## Implemented

Current functionality includes:

```text
frontend update checks
backend update checks
Template-owned update Redux state
Template-owned update hooks
Template-owned update watchers
update notifications
explicit update actions
frontend reload workflow
Core browser reload helper
server integration
authentication integration
standard Agent.Workbench update behavior
```

## Technical Review Areas

Potential technical decomposition remains around:

```text
broad API/update coupling
backend update communication
backend restart coordination
public Template update APIs
```

These are technical design topics.

They do not imply that standard update functionality belongs to Application.

## Future Consumer Work

Future concrete Applications may require:

```text
consumer-specific update configuration
consumer release-channel configuration
consumer update restrictions
consumer-specific update policies
```

These should be introduced only when actual consumer requirements exist.

---

# 39. Architecture Rules

Update changes must preserve these rules:

1. Core must not import Template or Application.
2. Template must not import concrete Application implementation.
3. Redux-dependent update state belongs to Template.
4. React lifecycle update hooks belong to Template.
5. Update watchers belong to Template.
6. Notification orchestration belongs to Template.
7. Standard Agent.Workbench update functionality belongs to Template.
8. Pure framework-independent update helpers may belong to Core.
9. Concrete consumer-only update behavior belongs to Application.
10. Connectivity failure must not automatically trigger logout.
11. Authentication logic must not be duplicated inside the update system.
12. Automatic checks must not be confused with automatic installation.
13. Screens must not duplicate reusable update logic.
14. Technical decomposition must not be confused with Application extraction.
15. Ownership must be determined by responsibility rather than Agent.Workbench naming.

---

# 40. Incorrect Legacy Interpretation

The following statements do not describe the accepted architecture:

```text
"Agent.Workbench update behavior must move into Application."

"Agent.Workbench-specific backend update behavior is automatically product code."

"Standard update functionality inside Template is transitional."

"Update Redux state must move into an Agent.Workbench Application."

"The Base Template must remove Agent.Workbench update behavior before repository separation."

"A separate Agent.Workbench Application repository must own the update workflow."

"Public update APIs are required specifically for Agent.Workbench extraction."
```

The correct ownership is:

```text
technical framework-independent update capability
    -> Core

standard reusable update platform
    -> Template

concrete consumer-only update behavior
    -> Application
```

---

# 41. Validation

After update-related implementation changes, useful searches include:

```bash
git grep -n "updateSlice" -- src test
git grep -n "PostLoginUpdateWatcher" -- src test
git grep -n "UpdateNotificationWatcher" -- src test
git grep -n "useFrontendVersionReloadWeb" -- src test
git grep -n "usePostLoginAutoReloadWeb" -- src test
git grep -n "reloadUpdatedFrontendWebApp" -- src test
```

Architecture checks:

```bash
git grep -n "@/application/" -- src/template
git grep -n "@/template/" -- src/application
```

Then run:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

When runtime update behavior changes:

```bash
npm start
```

For a cleared cache while preserving npm lifecycle hooks:

```bash
npm start -- --clear
```

---

# 42. Success Criteria

The update architecture is correct when:

1. Core contains only focused technical update capabilities.
2. Template owns reusable update state and application-platform orchestration.
3. Standard Agent.Workbench update behavior remains Template-owned.
4. Concrete consumer-only update behavior remains Application-owned.
5. Core has no Redux or Template dependencies.
6. Template has no concrete Application dependency.
7. Frontend update checks and reload behavior avoid duplicated logic.
8. Backend updates reuse existing server infrastructure.
9. Authentication remains separate from update logic.
10. Connectivity remains separate from authentication.
11. Update notifications use reusable Template notification infrastructure.
12. Technical decomposition does not become Application extraction.
13. A concrete consumer such as HEMS can use the reusable update platform without modifying Template internals.

---

# 43. Summary

Update functionality follows:

```text
Application --> Template --> Core
```

Core owns focused technical capabilities such as:

```text
frontend WebApp reload
```

Template owns:

```text
update state
update hooks
update watchers
update UI
notifications
update orchestration
standard Agent.Workbench update behavior
```

Application owns only concrete consumer-specific update behavior where required.

Agent.Workbench naming does not automatically imply Application ownership.

Standard Agent.Workbench update functionality is part of the Base Template and is not transitional Application code.
