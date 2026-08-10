# Update System

This document describes the frontend and backend update architecture of
`web.template`, including update checks, update state, notifications,
watchers, user interaction, and frontend reload behavior.

The architecture follows:

```text
Application --> Template --> Core
```

Update functionality is separated according to responsibility.

---

## 1. Purpose

The update system checks whether updates are available for:

```text
Frontend WebApp
Backend server
```

It supports:

- Loading update configuration
- Checking for frontend updates
- Checking for backend updates
- Publishing update notifications
- Displaying update information
- Starting explicitly requested updates
- Tracking update progress
- Tracking update errors
- Reloading the WebApp after a frontend update
- Reacting to backend restart and reconnect behavior

The update system must clearly distinguish:

```text
checking for updates
```

from:

```text
installing updates
```

Automatic checks must not automatically imply automatic installation unless
that behavior is explicitly introduced and documented.

---

## 2. Architecture

The current ownership is approximately:

```text
Template
|
+-- update Redux state
+-- update hooks
+-- update watchers
+-- update UI
+-- notifications
+-- application-shell orchestration

Core
|
+-- framework-independent frontend reload helper
```

The Template may use Core.

Core must not import Template or Application code.

---

## 3. Responsibility Rule

Update functionality must not be moved into Core simply because it is
technical.

A module belongs to Core only when it is independent from:

- Redux
- Template UI
- Template application lifecycle
- Notifications
- Navigation
- Concrete application state

The ownership rule is:

```text
Pure technical update capability --> Core
Reusable update state/UI          --> Template
Product-specific update behavior  --> Application
```

---

## 4. Current Structure

Important update areas currently include:

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

The exact internal file structure may continue to evolve, but the layer
ownership must remain consistent.

---

## 5. Update Redux State

Reusable update state belongs to the Template.

The current update state lives under:

```text
src/template/state/update/
```

The update state may contain information such as:

- Update configuration
- Frontend update availability
- Backend update availability
- Current frontend version
- Available frontend version
- Current backend version
- Available backend version
- Update progress
- Update status
- Update errors
- Active update operation

Redux is a state-management technology and does not make this state Core-owned.

Because the state participates in the reusable application shell, it belongs
to Template.

---

## 6. Why Update Redux State Is Not Core

Core should remain independent from Redux application composition.

The following is therefore not the target architecture:

```text
Core
+-- Redux update slice
+-- Template notifications
+-- Template update UI
```

Instead:

```text
Template
+-- Redux update state
+-- update orchestration
+-- update UI
+-- notifications

Core
+-- reusable technical helper
```

This prevents Core from depending upward on Template infrastructure.

---

## 7. Update Hooks

Reusable update hooks that coordinate application-shell behavior belong to the
Template.

They currently live under:

```text
src/template/hooks/update/
```

Known update hooks include functionality for:

- Frontend version monitoring
- Post-login frontend reload checks

Examples include:

```text
useFrontendVersionReloadWeb.ts
usePostLoginAutoReloadWeb.ts
```

These hooks belong to Template because they coordinate React lifecycle,
application state, or Template behavior.

They must not be documented as Core hooks.

---

## 8. Update Watchers

Runtime update watchers belong to the reusable Template application shell.

They currently live under:

```text
src/template/update/watchers/
```

Known watchers include:

```text
PostLoginUpdateWatcher.tsx
UpdateNotificationWatcher.tsx
```

These components may:

- Observe Redux update state
- Trigger update checks
- Publish notifications
- Coordinate update behavior after login
- Integrate update state with the application lifecycle

They are not Redux reducers.

They are also not Core infrastructure because they depend on Template runtime
behavior.

---

## 9. Post-Login Update Watcher

`PostLoginUpdateWatcher` coordinates update behavior after successful
authentication.

Conceptually:

```text
Login completed
        |
        v
PostLoginUpdateWatcher
        |
        v
Check relevant update state
        |
        v
Run required Template update behavior
```

This behavior belongs to Template because it depends on the application
lifecycle.

Core must not know when a user logs into the Template application.

---

## 10. Update Notification Watcher

`UpdateNotificationWatcher` observes update information and integrates it with
the reusable notification system.

Conceptually:

```text
Update state changes
        |
        v
UpdateNotificationWatcher
        |
        v
Template notification system
        |
        v
User notification
```

Notification orchestration belongs to Template.

The update slice should not need to know presentation details.

---

## 11. Notifications

Update notifications use the reusable Template notification infrastructure.

Notification state belongs under:

```text
src/template/state/notifications/
```

The update system may publish notifications when:

- A frontend update is available
- A backend update is available
- An update operation succeeds
- An update operation fails

The exact notification behavior should remain separate from the technical
update API implementation.

---

## 12. Frontend Update Flow

The frontend update flow conceptually looks like:

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

The user interface remains responsible for explicit user interaction.

The reload implementation itself should not be duplicated in screens.

---

## 13. Frontend Reload Helper

The reusable technical frontend reload implementation is located at:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

This module belongs to Core because it represents a focused technical
capability and does not need to own Template state or presentation.

Conceptually:

```text
Template decides reload is required
        |
        v
Core reload helper
        |
        v
Browser reload
```

Core provides the technical mechanism.

Template decides when that mechanism should be used.

---

## 14. Frontend Version Monitoring

Frontend version monitoring is handled by Template update infrastructure.

A known hook is:

```text
src/template/hooks/update/useFrontendVersionReloadWeb.ts
```

Its responsibility is to observe the relevant update/version state and
coordinate the reload decision.

It may use:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

for the actual browser reload.

This preserves the dependency direction:

```text
Template --> Core
```

---

## 15. Post-Login Reload Handling

Post-login frontend update behavior is coordinated through Template update
infrastructure.

A known hook is:

```text
src/template/hooks/update/usePostLoginAutoReloadWeb.ts
```

The corresponding application-shell behavior may also be coordinated by:

```text
src/template/update/watchers/PostLoginUpdateWatcher.tsx
```

The exact responsibilities between hook and watcher should remain explicit.

Neither should duplicate the Core browser reload implementation.

---

## 16. Backend Update Flow

Backend updates differ from frontend updates because the backend may become
temporarily unavailable during restart.

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
User starts backend update
        |
        v
Backend restarts
        |
        v
Temporary connectivity loss
        |
        v
Backend becomes reachable again
        |
        v
Authentication/session state is reevaluated
```

Backend restart behavior must coordinate with existing server,
connectivity, and authentication infrastructure.

---

## 17. Connectivity During Backend Update

A backend update may temporarily make the server unreachable.

This does not automatically mean:

```text
user logged out
```

The architecture rule remains:

```text
Connectivity failure != authentication failure
```

The update system must not introduce special connectivity logic that conflicts
with the reusable server infrastructure.

Connectivity state belongs to:

```text
src/template/state/connectivity/
```

Technical server checks belong to:

```text
src/core/server/
```

---

## 18. Authentication After Backend Update

After a backend update, authentication state may need to be reevaluated.

Possible outcomes include:

```text
JWT session remains usable
JWT session becomes invalid
OIDC browser session remains valid
OIDC browser session expires
```

The update system should not implement a second authentication mechanism.

It must reuse the existing authentication and session infrastructure.

---

## 19. Automatic Update Checks

An update strategy may enable automatic checks.

Conceptually:

```text
autoUpdate enabled
        |
        v
automatic update checks
```

Automatic checking must be distinguished from installation.

Unless explicitly defined otherwise:

```text
automatic check != automatic installation
```

Installation remains an explicit operation initiated through supported user
interaction.

---

## 20. Manual Installation

Frontend and backend update installation can be triggered through the reusable
Template UI.

The Template is responsible for:

- Presenting available updates
- Showing update information
- Receiving user confirmation
- Displaying progress
- Displaying errors
- Showing completion state

Technical details should remain outside presentation components where
possible.

---

## 21. Update UI

Reusable update screens and dialogs belong to Template.

They may contain:

- Frontend update information
- Backend update information
- Update strategy information
- Check actions
- Install actions
- Confirmation dialogs
- Progress state
- Error state

The UI consumes update state.

It must not become the primary owner of update API logic.

---

## 22. Separation of Responsibilities

The intended separation is:

```text
Template update UI
        |
        v
Template update state/orchestration
        |
        v
technical APIs/helpers
```

For frontend reload:

```text
Template update orchestration
        |
        v
Core reload helper
```

For backend communication:

```text
Template update orchestration
        |
        v
existing API/server infrastructure
```

This avoids duplicated technical behavior.

---

## 23. Application Ownership

A concrete application may eventually provide product-specific update
configuration.

Possible examples include:

- Whether a product exposes backend updates
- Product-specific release channels
- Product-specific update policies
- Product-specific visibility rules

Such configuration belongs to Application.

The Base Template must not directly import Agent.Workbench-specific update
configuration.

---

## 24. Base Template Responsibility

The Base Template may provide reusable update capabilities such as:

```text
update state
update UI
update checks
update watchers
notifications
update orchestration
```

A concrete application should be able to consume these capabilities without
modifying Template internals.

Product-specific behavior should be introduced through supported extension or
configuration mechanisms.

---

## 25. Core Boundary

Core update infrastructure should remain small and technical.

Current known Core update functionality includes:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

Core update code must not depend on:

- Redux store composition
- Template notifications
- Template screens
- Template navigation
- Application configuration
- Product-specific update state

If a module requires these dependencies, it belongs above Core.

---

## 26. Transitional Areas

The update architecture has already been partially separated, but some
responsibilities may still require review.

Current architecture:

```text
Update Redux state          --> Template
Update hooks                --> Template
Update watchers             --> Template
Update notifications        --> Template
Update UI                   --> Template
Browser reload helper       --> Core
```

Future refactoring should preserve these ownership rules.

Do not move the full update feature into Core.

---

## 27. Relationship to Redux

Redux state for updates belongs to Template because it supports reusable
application-shell behavior.

The state participates in the Template reducer composition.

Conceptually:

```text
templateReducers
        |
        +-- update
```

The new extensible Redux architecture does not require the update reducer to
move into Application.

Only product-specific update state should belong to a concrete Application.

---

## 28. Relationship to Notifications

Updates and notifications are separate responsibilities.

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

The notification slice should remain reusable.

The update slice should not directly contain notification presentation logic.

---

## 29. Relationship to Server Infrastructure

Backend updates depend on server reachability and switching infrastructure.

Relevant ownership:

```text
Technical server checks --> Core
Server/connectivity state --> Template
Update orchestration --> Template
```

The update system must reuse those mechanisms rather than introducing local
server checks.

---

## 30. Relationship to Authentication

Backend restart may affect authentication.

Relevant ownership:

```text
Technical authentication capability --> Core
Authentication/session orchestration --> Template
Update orchestration --> Template
```

The update system may trigger reevaluation but must not duplicate login,
logout, session, or token logic.

---

## 31. Migration History

The update architecture has been migrated incrementally.

Important completed changes include:

- Update Redux state moved under `src/template/state/update`.
- Update hooks moved under `src/template/hooks/update`.
- Runtime update watchers are located under
  `src/template/update/watchers`.
- Browser reload logic was extracted into
  `src/core/update/reloadUpdatedFrontendWebApp.ts`.
- Update imports were adjusted to the layered architecture.
- Update functionality remains reusable without making Core depend on
  Template state.

The migration intentionally avoids changing runtime behavior unnecessarily.

---

## 32. Safe Refactoring Workflow

Update refactoring should continue in small batches.

Preferred sequence:

```text
Analyze responsibility
        |
        v
Search all usages
        |
        v
Move or extract one responsibility
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
Test runtime behavior
        |
        v
Update documentation
```

Do not move all update modules at once.

---

## 33. Import Policy

Prefer stable architectural imports.

Example:

```ts
import {
  reloadUpdatedFrontendWebApp,
} from "@/core/update/reloadUpdatedFrontendWebApp";
```

Template update modules may import Core helpers.

Core update modules must not import from:

```text
@/template
@/application
```

Avoid broad automated import rewrites.

Search exact paths before changing them.

---

## 34. Validation

After update-related architecture changes, search important references.

Examples:

```bash
git grep -n "updateSlice" -- src test
git grep -n "PostLoginUpdateWatcher" -- src test
git grep -n "UpdateNotificationWatcher" -- src test
git grep -n "useFrontendVersionReloadWeb" -- src test
git grep -n "usePostLoginAutoReloadWeb" -- src test
git grep -n "reloadUpdatedFrontendWebApp" -- src test
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run targeted Jest tests where available.

Validate the patch:

```bash
git diff --check
```

When update runtime behavior changes, start the application through:

```bash
npm start
```

For a cleared cache while preserving npm lifecycle hooks:

```bash
npm start -- --clear
```

Do not use direct `npx expo start` as the normal validation path when
application configuration may have changed.

---

## 35. Current Status

### Implemented

- Frontend update checks
- Backend update checks
- Template-owned update Redux state
- Template-owned update hooks
- Template-owned update watchers
- Update notifications
- Explicit update actions
- Frontend reload workflow
- Reusable Core browser reload helper
- Integration with server and authentication infrastructure

### Transitional

- Some update responsibilities may still be coupled to broad API state.
- Concrete backend update behavior may still be Agent.Workbench-specific.
- Final Application-level update configuration is not yet defined.
- Final public Base Template update API is not yet complete.

### Planned

- Review product-specific backend update ownership.
- Define supported application update configuration where required.
- Continue reducing mixed API/update responsibilities.
- Maintain the Core/Template dependency boundary.
- Define stable public update APIs for separate application repositories.
- Preserve targeted automated update tests.

---

## 36. Architecture Rules

Update-related changes must preserve these rules:

1. Core must not import Template or Application.
2. Redux-dependent update state belongs to Template.
3. React lifecycle update hooks belong to Template.
4. Update watchers belong to Template.
5. Notification orchestration belongs to Template.
6. Pure framework-independent reload logic may belong to Core.
7. Product-specific update behavior belongs to Application.
8. Connectivity failure must not automatically trigger logout.
9. Authentication logic must not be duplicated inside the update system.
10. Automatic checks must not be confused with automatic installation.
11. Screens must not duplicate reusable update logic.
12. Runtime behavior must be preserved during architecture moves.

---

## 37. Next Steps

Recommended next architecture work includes:

- Review concrete backend update ownership.
- Review update API dependencies separately from UI state.
- Keep frontend reload logic centralized.
- Keep update notifications separate from update state.
- Define a stable Base Template update API.
- Review which update settings belong to Application configuration.
- Add or maintain dependency-boundary validation.
- Keep update refactoring incremental.

Do not move modules solely to produce a visually cleaner directory.

Move them only when their actual responsibility and dependency direction
support the target architecture.

---

## 38. Success Criteria

The update architecture is complete when:

1. Core contains only framework-independent update capabilities.
2. Template owns reusable update state and application-shell orchestration.
3. Application owns concrete product-specific update configuration.
4. Core has no Redux or Template dependency.
5. Frontend update checks and reloads work without duplicated logic.
6. Backend updates reuse the existing server infrastructure.
7. Authentication remains separate from update logic.
8. Connectivity remains separate from authentication.
9. Update notifications use the reusable Template notification system.
10. A separate Application repository can use the Base Template update
    infrastructure without modifying internal Template code.