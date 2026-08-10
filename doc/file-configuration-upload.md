# File Configuration Upload

This document describes the reusable file-configuration upload and download
workflow of `web.template`.

The feature allows users to download and upload backend configuration files
through the Agent.Workbench settings API.

The architecture follows:

```text
Application --> Template --> Core
```

The current file-configuration feature is implemented as reusable Template
functionality.

---

## 1. Purpose

The file-configuration feature supports:

- Discovering available backend configuration types
- Selecting a configuration type
- Downloading the current configuration
- Selecting a local configuration file
- Dragging and dropping files in the web application
- Uploading configuration files
- Handling backend warnings and errors
- Detecting relevant Jetty port changes
- Showing restart and progress information
- Coordinating server URL changes after an upload

The feature is primarily browser-oriented.

---

## 2. Current Architecture

The current ownership is:

```text
Template
|
+-- settings screen
+-- upload Redux state
+-- web file-drop hook
+-- reusable progress dialog
+-- upload/download orchestration
+-- localization

Core
|
+-- reusable server/authentication capabilities used by the feature
```

The feature currently depends on Agent.Workbench backend settings endpoints.

Whether the complete feature should remain part of the Base Template or become
application-specific should be decided based on reuse across future
applications.

---

## 3. Central Files

Current important files are:

| File | Purpose |
| --- | --- |
| `src/template/screens/settings/AppSettingsFileUploadScreen.tsx` | Main UI and upload/download orchestration. |
| `src/template/state/settings/appSettingsFileUploadSlice.ts` | Upload thunk and Redux upload state. |
| `src/template/hooks/useFileDropWeb.ts` | Reusable browser drag-and-drop behavior. |
| `src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx` | Shared progress dialog used by configuration upload and update workflows. |
| `assets/locales/*/FileConfiguration.json` | Translation namespace for file-configuration UI. |

The previous paths under `src/screens` and `src/hooks` are no longer the
current architecture.

---

## 4. Redux Ownership

Upload state belongs to Template.

The current slice is:

```text
src/template/state/settings/appSettingsFileUploadSlice.ts
```

It participates in the current Template Redux composition.

The reducer is currently referenced by both:

```text
src/template/state/store/rootReducer.ts
src/template/state/store/templateReducers.ts
```

This is consistent with the ongoing Redux migration where the current store
remains active while the extensible Template store infrastructure is being
prepared in parallel.

The configuration-upload reducer is reusable Template state and is not
Application-specific state at this time.

---

## 5. Configuration Type Discovery

The screen loads available configuration types through:

```text
GET /api/app/settings/get
X-Performative: FILE.CONFIGURATION
```

The response is inspected for entries whose key starts with:

```text
configurationtype
```

The first available configuration type can be selected as the initial value.

If configuration types cannot be loaded, the current workflow may fall back
to:

```text
JettyConfiguration
```

Configuration-type discovery belongs to the feature workflow rather than the
generic design system.

---

## 6. Download Flow

The current configuration is downloaded through:

```text
GET /api/app/settings/download
X-Performative: <selected configuration type>
```

Conceptually:

```text
User selects configuration type
        |
        v
Request current configuration
        |
        v
Receive file/blob
        |
        v
Determine filename
        |
        v
Start browser download
```

When available, the filename can be taken from the HTTP
`Content-Disposition` response header.

Browser download behavior is web-specific.

---

## 7. Upload Flow

Configuration files are uploaded through:

```text
POST /api/app/settings/upload
X-Performative: <selected configuration type>
Content-Type: multipart/form-data
```

The selected configuration file is sent as a `FormData` field named:

```text
file
```

Conceptually:

```text
Select file
    |
    v
Validate/inspect file when required
    |
    v
Create FormData
    |
    v
Upload configuration
    |
    v
Evaluate backend result
```

The upload state and asynchronous operation are handled through:

```text
src/template/state/settings/appSettingsFileUploadSlice.ts
```

---

## 8. Authentication

The upload request must use the authentication mechanism of the currently
selected server.

For JWT authentication, requests use the active JWT.

Conceptually:

```text
Authorization: Bearer <jwt>
```

For OIDC authentication, browser credentials are used.

Conceptually:

```text
credentials: include
```

The file-configuration feature must reuse the existing authentication
infrastructure.

It must not implement a separate login or token-management mechanism.

---

## 9. File Selection

The main file-selection and upload UI is implemented in:

```text
src/template/screens/settings/AppSettingsFileUploadScreen.tsx
```

The screen coordinates:

- Configuration-type selection
- File selection
- Drag-and-drop
- Upload actions
- Download actions
- Warning and error presentation
- Jetty configuration inspection
- Progress presentation
- Server URL handling

The screen should consume reusable infrastructure instead of duplicating
generic UI or authentication behavior.

---

## 10. Web Drag and Drop

Reusable web drag-and-drop behavior is implemented in:

```text
src/template/hooks/useFileDropWeb.ts
```

The settings screen imports and uses this hook.

Conceptually:

```text
Browser drag event
        |
        v
useFileDropWeb
        |
        v
Selected files
        |
        v
File configuration screen
```

The hook is web-specific reusable Template functionality.

File-drop behavior should not be duplicated directly inside individual
screens.

---

## 11. Backend Warning and Error Handling

The backend upload result may contain information such as:

```ts
messageType: "INFO" | "WARNING" | "ERROR";
message: string;
```

Warnings and errors must be handled before continuing with restart,
reconnection, or logout-related behavior.

Conceptually:

```text
Upload result
    |
    +-- INFO
    |     |
    |     v
    |   continue successful workflow
    |
    +-- WARNING
    |     |
    |     v
    |   show warning / stop follow-up flow
    |
    +-- ERROR
          |
          v
        show error / stop follow-up flow
```

An invalid configuration must not unnecessarily trigger logout or server
restart handling in the frontend.

---

## 12. Jetty Configuration Handling

Jetty configuration files may require additional inspection before upload.

Relevant settings can include:

```text
http.enabled
http.port
https.enabled
https.port
http.to.https
```

When the selected file represents Jetty configuration, the screen may inspect
the XML content to determine whether the effective server address would
change.

This is important because changing HTTP/HTTPS or port configuration may change
the URL the frontend must use after the backend restarts.

---

## 13. Server URL Change

When uploaded Jetty configuration would change the backend address, the user
may need to choose between:

```text
Use detected new server address
```

and:

```text
Keep current server address
```

If the current address should remain active, the browser-side workflow may
adjust the uploaded XML configuration before sending it to the backend.

Server URL handling must remain compatible with the shared server
infrastructure.

Reusable server normalization and validation belong under:

```text
src/core/server/
```

The file-upload screen should not introduce an independent server URL
architecture.

---

## 14. Successful Upload Flow

After a successful upload, the feature may need to coordinate backend restart
behavior.

Conceptually:

```text
Configuration uploaded
        |
        v
Show progress
        |
        v
Backend may restart
        |
        v
Synchronize server address if required
        |
        v
Reconnect / reevaluate authentication
        |
        v
Continue with active server
```

The exact sequence depends on the uploaded configuration and active
authentication mechanism.

The feature must reuse existing server and authentication infrastructure.

---

## 15. Progress Dialog

The configuration upload no longer uses a dedicated
`BackendUpdateProgressDialog`.

The shared progress component is:

```text
src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx
```

The same reusable component is also used by update screens such as:

```text
src/template/screens/update/tabs/UpdateBackendTab.tsx
src/template/screens/update/tabs/UpdateWebAppTab.tsx
```

This is intentional reuse.

The dialog provides presentation.

The configuration-upload screen and feature state remain responsible for
workflow decisions.

---

## 16. Why the Progress Dialog Is in the Design System

The progress dialog represents reusable presentation that is useful for more
than one feature.

Current consumers include:

```text
File configuration upload
Backend update
WebApp update
```

Therefore:

```text
Feature workflow
      |
      v
UpdateProgressDialog
```

The dialog must remain independent from a concrete backend update or
file-configuration business operation.

---

## 17. Authentication After Restart

Changing backend configuration may restart the server and affect the active
authentication session.

The file-configuration feature must not duplicate authentication logic.

Instead, it should cooperate with the existing authentication architecture.

Relevant ownership remains:

```text
Technical authentication capability --> Core
Authentication/session orchestration --> Template
File upload orchestration            --> Template
```

For JWT and OIDC behavior, see:

```text
doc/authentication.md
```

---

## 18. Connectivity After Restart

Temporary backend unavailability during restart is a connectivity event.

It must not automatically be interpreted as:

```text
authentication failure
```

The architecture rule remains:

```text
Connectivity failure != authentication failure
```

Connectivity state belongs to Template.

Technical server checks belong to Core.

For details, see:

```text
doc/server-check-and-switching.md
```

---

## 19. Browser-Specific Behavior

Several parts of the feature are browser-specific:

- File picker interaction
- Drag and drop
- Browser file downloads
- Blob URLs
- XML parsing
- Browser redirection

Native implementations may require separate adapters or feature decisions if
the configuration-upload workflow is ever required outside web.

Do not assume browser APIs are available on every React Native platform.

---

## 20. Localization

User-facing text for this feature uses the `FileConfiguration` translation
namespace.

Translation resources are located under:

```text
assets/locales/*/FileConfiguration.json
```

Reusable user-facing messages should not be hardcoded directly into the
screen when an appropriate translation key exists.

---

## 21. Relationship to the Design System

The settings screen should reuse the Template design system.

Relevant reusable components may include:

```text
ActionButton
ConfirmDialog
Dropdown
Infobox
UpdateProgressDialog
```

The feature must not create parallel generic UI components solely for file
configuration.

Product or feature-specific behavior belongs to the settings screen and its
state.

Generic visual behavior belongs to the design system.

---

## 22. Application Ownership

The current feature resides in Template.

However, the backend API:

```text
/api/app/settings/*
```

and specific configuration types such as:

```text
JettyConfiguration
```

may represent Agent.Workbench-specific behavior.

This ownership should be reviewed before final repository separation.

Possible future outcomes include:

```text
Reusable generic upload infrastructure --> Template
Agent.Workbench configuration workflow --> Application
```

This decision is not yet finalized.

Do not move the feature prematurely.

---

## 23. Current Status

### Implemented

- File-configuration settings screen under Template
- Configuration-type discovery
- Configuration download
- Configuration upload
- JWT and OIDC-aware upload communication
- Browser file selection
- Web drag-and-drop
- Upload Redux state
- Warning and error handling
- Jetty configuration inspection
- Server URL handling
- Shared progress-dialog reuse
- Localization

### Transitional

- Backend settings APIs may be Agent.Workbench-specific.
- Jetty-specific configuration handling may ultimately belong to a concrete
  Application.
- The current Redux store transition is still in progress.
- Final external Base Template API for file configuration has not been
  defined.

### Planned

- Review whether the complete feature belongs in Template or Application.
- Keep generic file-drop behavior reusable.
- Keep shared progress UI in the design system.
- Reuse server and authentication infrastructure.
- Avoid duplicating configuration-upload infrastructure across applications.

---

## 24. Architecture Rules

File-configuration changes must preserve these rules:

1. Core must not import Template UI.
2. Template must not import a concrete Application.
3. Generic UI belongs to the design system.
4. Upload Redux state belongs to its owning feature layer.
5. Authentication must use existing authentication infrastructure.
6. Connectivity must remain separate from authentication.
7. Server normalization must use shared server infrastructure.
8. Web-only APIs must not silently become native assumptions.
9. Warning and error responses must stop inappropriate follow-up workflows.
10. Agent.Workbench-specific behavior must be reviewed before final Template
    ownership is declared.
11. Screens must not duplicate reusable file-drop or progress UI.
12. Generated API code must not be modified for documentation cleanup.

---

## 25. Validation

After changing the file-configuration feature, search relevant dependencies:

```bash
git grep -n "AppSettingsFileUploadScreen" -- src test
git grep -n "appSettingsFileUploadSlice" -- src test
git grep -n "useFileDropWeb" -- src test
git grep -n "UpdateProgressDialog" -- src test
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run targeted tests where available.

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

---

## 26. Success Criteria

The file-configuration architecture is successful when:

1. The active file paths match the Template architecture.
2. Upload state is clearly owned.
3. Shared progress presentation is reused.
4. File drag-and-drop is not duplicated.
5. JWT and OIDC authentication remain compatible.
6. Backend restart does not confuse connectivity and authentication state.
7. Jetty-specific behavior is clearly distinguishable from generic Template
   infrastructure.
8. A future separate Application repository can reuse or replace this feature
   without modifying unrelated Template internals.