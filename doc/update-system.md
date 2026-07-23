# Update System

## 1. Purpose

The update system checks whether updates are available for the frontend WebApp
or the backend server.

It supports:

- loading the configured update strategy
- checking for frontend updates
- checking for backend updates
- displaying update notifications
- manually installing updates
- reloading the WebApp after a frontend update
- reconnecting and logging out after a backend update

The update system does not automatically install updates.

The `autoUpdate` setting controls automatic update checks only. Installation
always requires an explicit user action.

---

## 2. Scope

The update system consists of four areas:

```text
Update System
├── Redux state and API communication
├── Background watchers
├── Update user interface
└── Browser reload infrastructure
```

Reusable update infrastructure has been moved incrementally into the dedicated
`src/core/update` module.

The update screens and dialogs remain outside the Core and continue to handle
presentation and user interaction.

---

## 3. Current Core Structure

The reusable update infrastructure currently has the following structure:

```text
src/core/update
├── hooks
│   ├── useFrontendVersionReloadWeb.ts
│   └── usePostLoginAutoReloadWeb.ts
├── redux
│   └── updateSlice.ts
└── reloadUpdatedFrontendWebApp.ts
```

---

## 4. Central Files

| File | Purpose |
| --- | --- |
| `src/core/update/redux/updateSlice.ts` | Shared update state, update checks and update-related API actions. |
| `src/core/update/hooks/useFrontendVersionReloadWeb.ts` | Watches frontend version changes and triggers a browser reload when required. |
| `src/core/update/hooks/usePostLoginAutoReloadWeb.ts` | Handles automatic frontend reload checks after login. |
| `src/core/update/reloadUpdatedFrontendWebApp.ts` | Provides the reusable browser reload workflow after a frontend update. |
| `src/screens/update` | Update screens, tabs, dialogs and user interaction. |
| `src/screens/Notification` | Displays update-related notifications when update information is published through the notification system. |

---

## 5. Update State

The shared update Redux state manages frontend and backend update information.

Its responsibilities include:

- loading update configuration
- checking whether frontend updates are available
- checking whether backend updates are available
- tracking update progress
- tracking update errors
- exposing update state to screens and notifications
- starting explicitly requested update operations

The Redux module belongs to the Core because the update state and workflow are
shared technical infrastructure and are not specific to a product application.

---

## 6. Frontend Update Flow

The frontend update flow is:

```text
Check frontend version
↓
Detect a newer version
↓
Notify the user
↓
User starts the update
↓
Frontend update is completed
↓
Reload the WebApp
```

The reusable browser reload logic is implemented in:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

Frontend version monitoring and reload behavior are handled by the Core hooks.

The UI remains responsible for displaying update information and receiving the
user's decision.

---

## 7. Post-Login Reload Handling

After login, the application can check whether the loaded frontend version is
outdated.

The reusable post-login workflow is implemented in:

```text
src/core/update/hooks/usePostLoginAutoReloadWeb.ts
```

When a reload is required, the shared reload infrastructure is used instead of
duplicating browser reload logic inside a screen or application component.

---

## 8. Frontend Version Monitoring

Frontend version changes are observed through:

```text
src/core/update/hooks/useFrontendVersionReloadWeb.ts
```

The hook separates update monitoring from UI components.

Its responsibility is limited to detecting the relevant version state and
starting the reusable reload workflow when required.

---

## 9. Backend Update Flow

The backend update flow remains controlled through an explicit user action.

A typical flow is:

```text
Check backend version
↓
Detect an available update
↓
Notify the user
↓
User starts the installation
↓
Backend becomes temporarily unavailable
↓
Frontend reconnects
↓
Authentication state is reevaluated
```

A backend update can interrupt the active server connection and invalidate the
current authentication session.

The update UI therefore coordinates with the existing server and
authentication infrastructure.

---

## 10. Automatic Checks and Manual Installation

The update strategy can enable automatic checks through the `autoUpdate`
setting.

This distinction is important:

```text
autoUpdate enabled
=
automatic update checks

autoUpdate enabled
≠
automatic installation
```

Frontend and backend installations still require an explicit user action.

---

## 11. Separation of Responsibilities

The current update architecture separates reusable infrastructure from user
interface concerns.

### Core responsibilities

`src/core/update` contains:

- shared update Redux state
- frontend version monitoring
- post-login reload handling
- reusable browser reload logic

### UI responsibilities

Update screens and dialogs contain:

- update presentation
- buttons and confirmation actions
- progress display
- error messages
- user interaction

This separation keeps the reusable update workflow independent from individual
screens and product applications.

---

## 12. Current Architecture Status

The update module has been migrated into the Core incrementally without changing
the expected application behavior.

The completed migration includes:

- moving the shared update Redux slice into `src/core/update/redux`
- moving frontend update hooks into `src/core/update/hooks`
- extracting the browser reload workflow into a reusable Core function
- updating all affected imports
- testing the update behavior after the migration

The migration followed the standard architecture workflow:

```text
Analyze
↓
Move or extract one responsibility
↓
Update imports
↓
Test
↓
Commit
↓
Update documentation
```